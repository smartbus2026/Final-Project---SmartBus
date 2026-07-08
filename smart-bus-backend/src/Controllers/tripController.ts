import { Request, Response } from "express";
import mongoose from "mongoose";
import Trip from "../models/Trip";
import Route from "../models/Route";
import Notification from "../models/notification";
import User from "../models/User";
import Quota from "../models/quotaModel";
import Bus from "../models/Bus";
import SystemSettings from "../models/SystemSettings.model";
import { getIO } from "../socket";
import {
  NotificationManager,
  PushNotificationStrategy,
  EmailNotificationStrategy,
  MultiChannelStrategy
} from "../services/notification";

const dispatchFleetAlerts = async (shiftCount: number, dailyCount: number, usedCapacity: number, totalCapacity: number, time_slot: string) => {
  const adminIds = await User.find({ role: "admin" }).select("_id");
  const pushStrategy = new PushNotificationStrategy();
  const criticalStrategy = new MultiChannelStrategy([
    new PushNotificationStrategy(),
    new EmailNotificationStrategy()
  ]);

  const systemSettings = (await SystemSettings.findOne()) ?? (await SystemSettings.create({}));
  const shiftLimit = systemSettings.defaultShiftLimit;

  for (const admin of adminIds) {
    const adminId = admin._id.toString();

    if (shiftCount >= shiftLimit) {
      await NotificationManager.notify(
        adminId,
        pushStrategy,
        "Shift Overflow Warning",
        `Warning: You exceeded the ${shiftLimit}-bus limit for the ${time_slot} shift. This deducts from your return or extra balance.`
      );
    }

    const newDailyTotal = dailyCount + 1;
    if (newDailyTotal > 14) {
      await NotificationManager.notify(adminId, pushStrategy, "Daily Limit Exceeded", "Alert: You exceeded the 14-bus daily limit. Deducting from future days.");
    } else if (newDailyTotal === 14) {
      await NotificationManager.notify(adminId, pushStrategy, "Daily Allowance Reached", "Info: Trip scheduled successfully. You have reached your standard 14-bus allowance for today.");
    } else {
      await NotificationManager.notify(adminId, pushStrategy, "Daily Pacing Info", `Info: Trip scheduled successfully. You have ${14 - newDailyTotal} buses remaining in today's standard 14-bus allowance.`);
    }

    if (usedCapacity === Math.floor(totalCapacity * 0.8)) {
      await NotificationManager.notify(adminId, criticalStrategy, "Low Balance Alert", "Critical: You have consumed 80% of your monthly bus quota.");
    }
  }
};

// Create Trip (Admin)
export const createTrip = async (req: Request, res: Response) => {
  try {
    const { route_id, time_slot, departure_time, total_seats, bus_number, driver } = req.body;

    const route = await Route.findById(route_id);
    if (!route) return res.status(404).json({ message: "Route not found" });

    const busDoc = await Bus.findOne({ busCode: bus_number });

    const tripData: any = {
      route: route_id,
      date: departure_time,
      time_slot,
      bus_number,
      total_seats,
    };

    if (busDoc) {
      tripData.bus = busDoc._id;
    }

    if (req.body.driver_id) {
      tripData.driver = req.body.driver_id;
    } else if (driver) {
      tripData.driver = driver;
    }

    if (!tripData.driver) {
      return res.status(400).json({ message: "Driver ID is strictly required" });
    }

    console.log("Saving new trip to DB with Driver ObjectId:", tripData.driver);

    // =========================================================================
    // MONTHLY QUOTA & FLEET ALLOCATION LOGIC
    // =========================================================================
    
    // 1. Identify current monthYear
    const tripDate = new Date(departure_time);
    const month = String(tripDate.getMonth() + 1).padStart(2, '0');
    const year = tripDate.getFullYear();
    const monthYear = `${month}-${year}`;

    // 2. Quota Initialization & Hard Limit Check
    const systemSettings = (await SystemSettings.findOne()) ?? (await SystemSettings.create({}));
    let quota = await Quota.findOne({ monthYear });
    if (!quota) {
      quota = new Quota({ monthYear, totalCapacity: systemSettings.monthlyBusQuota, usedCapacity: 0 });
    }

    if (quota.usedCapacity >= quota.totalCapacity) {
      return res.status(403).json({ message: "Monthly quota exhausted. Cannot create more trips." });
    }

    // 3. Current Day Usage Calculations (Soft Limits)
    const startOfDay = new Date(tripDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(tripDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyCount = await Trip.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const shiftCount = await Trip.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
      time_slot: time_slot
    });

    // 4. Save & Increment
    quota.usedCapacity += 1;
    await quota.save();

    const trip = new Trip(tripData);
    await trip.save();

    // 5. Trigger Notifications via SOLID Multi-Channel Dispatcher
    await dispatchFleetAlerts(shiftCount, dailyCount, quota.usedCapacity, quota.totalCapacity, time_slot);
    // =========================================================================

    const students = await User.find({ role: "student" }).select("_id");
    const notifications = students.map((s: any) => ({
      user: s._id,
      title: "New Trip Added",
      message: `A new bus trip has been scheduled for ${new Date(trip.date).toDateString()} - ${trip.time_slot}`,
      type: "trip",
      read: false
    }));
    await Notification.insertMany(notifications);

    res.status(201).json(trip);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Trips — supports optional ?date=tomorrow&?status=scheduled
export const getTrips = async (req: Request, res: Response) => {
  try {
    const filter: any = { isArchived: { $ne: true } };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.date === "tomorrow" || req.query.date === "upcoming") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      filter.date = { $gte: start };
    }

    const trips = await Trip.find(filter)
      .populate({ path: "route", populate: { path: "stops", model: "Stop" } })
      .populate("driver", "name email")
      .populate("bus");

    res.json({ results: trips.length, data: trips });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get trips assigned to the logged-in driver
// Returns each trip enriched with:
//   • route.stops   — populated Stop documents
//   • usersCount    — number of active/pending bookings on this trip
//   • scheduled_time — ISO string of trip.date for frontend time-gating
export const getDriverTrips = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?._id;
    if (!driverId) return res.status(401).json({ message: "Unauthorized" });

    // Filter by today and upcoming future dates
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const filter: any = { 
      driver: driverId,
      date: { $gte: startOfToday },
      isArchived: { $ne: true }
    };

    // Default: only active and scheduled trips
    if (!req.query.all) {
      filter.status = { $in: ["scheduled", "active", "in-progress", "in_progress"] };
    }

    // Fetch raw trips with route + stops populated
    let trips = await Trip.find(filter)
      .populate({
        path: "route",
        populate: { path: "stops", model: "Stop" },
      })
      .populate("bus")
      .sort({ date: 1 })
      .lean();   // lean() so we can attach extra properties below
      
    

    // For each trip, count the bookings that belong to it.
    // Bookings link to route (not trip directly), so we match on:
    //   route  = trip.route._id
    //   date   = same calendar day as trip.date
    //   status = pending | assigned | active (i.e. not cancelled/missed)
    //
    // The timeSlot in Booking is "Morning" | "Return" while Trip uses
    // "morning" | "return_1530" | "return_1900".  We map accordingly.
    const Booking = (await import("../models/Booking.model")).default;

    const slotMap: Record<string, string[]> = {
      morning:      ["Morning"],
      return_1530:  ["Return"],
      return_1900:  ["Return"],
    };

    const enrichedTrips = await Promise.all(
      trips.map(async (trip: any) => {
        const dayStart = new Date(trip.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(trip.date);
        dayEnd.setHours(23, 59, 59, 999);

        const matchingSlots = slotMap[trip.time_slot] ?? [];

        const usersCount = await Booking.countDocuments({
          route:    trip.route?._id ?? trip.route,
          date:     { $gte: dayStart, $lte: dayEnd },
          timeSlot: { $in: matchingSlots },
          status:   { $in: ["pending", "assigned", "active"] },
        });

        return {
          ...trip,
          usersCount,
          // scheduled_time is the canonical ISO departure time.
          // The frontend uses this to compute the 15-minute time gate.
          scheduled_time: trip.date instanceof Date
            ? trip.date.toISOString()
            : trip.date,
        };
      })
    );

    res.json({ results: enrichedTrips.length, data: enrichedTrips });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get driver trip history with filters
export const getDriverHistory = async (req: Request, res: Response) => {
  try {
    const driverId = req.params.driverId || (req as any).user?._id;
    if (!driverId) return res.status(401).json({ message: "Unauthorized" });

    const { date, timeSlot, specificReturnTime } = req.query;

    const filter: any = { 
      driver: driverId,
      isArchived: { $ne: true }
    };

    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (timeSlot && timeSlot !== 'All' && timeSlot !== '') {
      if (timeSlot === 'Morning') {
        filter.time_slot = 'morning';
      } else if (timeSlot === 'Return') {
        if (specificReturnTime && specificReturnTime !== 'All' && specificReturnTime !== '') {
          filter.time_slot = (specificReturnTime === '19:00' || specificReturnTime === '7:00 PM') ? 'return_1900' : 'return_1530';
        } else {
          filter.time_slot = { $in: ['return_1530', 'return_1900'] };
        }
      }
    }

    let trips = await Trip.find(filter)
      .populate("route")
      .populate("bus")
      .sort({ date: -1 })
      .lean();

    const Booking = (await import("../models/Booking.model")).default;
    const slotMap: Record<string, string[]> = {
      morning:      ["Morning"],
      return_1530:  ["Return"],
      return_1900:  ["Return"],
    };

    const enrichedTrips = await Promise.all(
      trips.map(async (trip: any) => {
        const dayStart = new Date(trip.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(trip.date);
        dayEnd.setHours(23, 59, 59, 999);

        const matchingSlots = slotMap[trip.time_slot] ?? [];

        const usersCount = await Booking.countDocuments({
          route:    trip.route?._id ?? trip.route,
          date:     { $gte: dayStart, $lte: dayEnd },
          timeSlot: { $in: matchingSlots },
          status:   { $in: ["pending", "assigned", "active", "completed"] },
        });

        return {
          ...trip,
          usersCount,
        };
      })
    );

    res.json({ results: enrichedTrips.length, data: enrichedTrips });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get Single Trip
export const getTripById = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate({ path: "route", populate: { path: "stops", model: "Stop" } })
      .populate("driver", "name email")
      .populate("bus");

    if (!trip) return res.status(404).json({ message: "Trip not found" });

    res.json(trip);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Helper to parse composite IDs into a MongoDB query filter
const buildCompositeFilter = (idString: string): any => {
  const parts = idString.split("-");
  // Format: busId-routeId-timeSlot-specificReturnTime
  const routeId = parts[1];
  const timeSlotRaw = parts[2];
  const specificReturnTime = parts.slice(3).join("-");

  let time_slot = "morning";
  if (timeSlotRaw === "Return") {
    time_slot = (specificReturnTime === "19:00" || specificReturnTime === "7:00 PM") ? "return_1900" : "return_1530";
  }

  return { route: new mongoose.Types.ObjectId(routeId), time_slot: time_slot };
};

// Update Trip (Admin)
export const updateTrip = async (req: Request, res: Response) => {
  try {
    const updateData: any = { ...req.body };

    if (updateData.driver === "") {
      return res.status(400).json({ message: "Driver ID is strictly required" });
    }
    if (req.body.driver_id) {
      updateData.driver = req.body.driver_id;
    }

    if (updateData.bus_number) {
      const busDoc = await Bus.findOne({ busCode: updateData.bus_number });
      if (busDoc) {
        updateData.bus = busDoc._id;
      }
    }

    if (req.params.id.includes("-")) {
      const filter: any = buildCompositeFilter(req.params.id as string);
      
      // Attempt to respect date if provided in body
      if (updateData.date || updateData.departure_time) {
        const targetDate = updateData.date || updateData.departure_time;
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.$or = [
          { date: { $gte: startOfDay, $lte: endOfDay } },
          { departure_time: { $gte: startOfDay, $lte: endOfDay } }
        ];
      }

      await Trip.updateMany(filter, updateData, { runValidators: true });
      return res.json({ message: "Grouped trips updated successfully." });
    }

    // =========================================================================
    // RESOURCE CONFLICT VALIDATION (Single Trip)
    // =========================================================================
    const existingTrip = await Trip.findById(req.params.id);
    if (!existingTrip) return res.status(404).json({ message: "Trip not found" });

    const targetDate = updateData.date || updateData.departure_time || (existingTrip as any).date || (existingTrip as any).departure_time;
    const targetTimeSlot = updateData.time_slot || (existingTrip as any).time_slot;
    const requestedDriver = updateData.driver || (existingTrip as any).driver;
    const requestedBus = updateData.bus_number || (existingTrip as any).bus_number;

    if (requestedDriver && requestedBus && targetDate && targetTimeSlot) {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const conflictQuery: any = {
        _id: { $ne: req.params.id as string },
        time_slot: targetTimeSlot,
        status: { $ne: "cancelled" },
        $and: [
          {
            $or: [
              { date: { $gte: startOfDay, $lte: endOfDay } },
              { departure_time: { $gte: startOfDay, $lte: endOfDay } }
            ]
          },
          {
            $or: [
              { driver: requestedDriver },
              { bus_number: requestedBus }
            ]
          }
        ]
      };

      const conflict = await Trip.findOne(conflictQuery);
      if (conflict) {
        return res.status(409).json({ 
          message: "Conflict: This Bus or Driver is already assigned to another route on this date and time slot." 
        });
      }
    }
    // =========================================================================

    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    ).populate("driver", "name email");

    if (!trip) return res.status(404).json({ message: "Trip not found" });

    res.json(trip);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Bulk Delete Trips (Admin)
export const bulkDeleteTrips = async (req: Request, res: Response) => {
  try {
    const { tripIds } = req.body;
    if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    const Booking = (await import("../models/Booking.model")).default;

    for (const id of tripIds) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const trip = await Trip.findById(id);
        if (trip) {
          const dayStart = new Date(trip.date);
          dayStart.setUTCHours(0, 0, 0, 0);
          const dayEnd = new Date(trip.date);
          dayEnd.setUTCHours(23, 59, 59, 999);
          
          const bookingTimeSlot = trip.time_slot.includes("return") ? "Return" : "Morning";
          const query: any = {
            route: trip.route,
            timeSlot: bookingTimeSlot,
            date: { $gte: dayStart, $lte: dayEnd },
            status: "assigned"
          };
          if (trip.time_slot === "return_1900") query.specificReturnTime = { $in: ["19:00", "7:00 PM"] };
          if (trip.time_slot === "return_1530") query.specificReturnTime = { $in: ["15:30", "3:30 PM", "15:00", "3:00 PM"] };
          
          await Booking.updateMany(query, { $set: { status: "pending" }, $unset: { busId: "" } });
          await Trip.findByIdAndUpdate(id, { isArchived: true });
        }
      } else if (typeof id === "string" && id.includes("-")) {
        // Fallback: Trip document doesn't exist, revert Bookings using the composite string
        const parts = id.split("-");
        const busId = parts[0];
        const routeId = parts[1];
        const timeSlot = parts[2];
        const specificReturnTime = parts.slice(3).join("-");
        
        const query: any = {
          status: "assigned",
          busId: busId === "unknown-bus" || busId === "none" ? { $exists: false } : busId,
          route: routeId,
          timeSlot: timeSlot
        };
        if (specificReturnTime && specificReturnTime !== "none") {
          query.specificReturnTime = specificReturnTime;
        }
        await Booking.updateMany(query, { $set: { status: "pending" }, $unset: { busId: "" } });
      }
    }

    return res.json({ message: "Trips deleted and bookings unassigned successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Trip (Admin)
export const deleteTrip = async (req: Request, res: Response) => {
  try {
    if (req.params.id.includes(",")) {
      const idArray = (req.params.id as string)
        .split(",")
        .filter((id: string) => mongoose.Types.ObjectId.isValid(id.trim()))
        .map((id: string) => new mongoose.Types.ObjectId(id.trim()));

      if (idArray.length > 0) {
        await Trip.updateMany({ _id: { $in: idArray } }, { isArchived: true });
        return res.json({ message: "Grouped trips deleted successfully" });
      }
    }

    // Fallback for single standard ID deletion
    if (mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      const trip = await Trip.findByIdAndUpdate(req.params.id, { isArchived: true });
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      return res.json({ message: "Trip deleted successfully" });
    }

    return res.status(400).json({ message: "Invalid ID format provided" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Start Trip — called by driver OR admin
// No time-gate: driver can start at any time.
export const startTrip = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    // Normalize to in_progress (underscore) for consistency across the codebase
    trip.status = "in_progress";
    (trip as any).start_time = new Date();
    await trip.save();

    // Notify all connected clients that the trip is now active
    try {
      const io = getIO();
      const tripId = trip._id.toString();
      const routeId = trip.route.toString();

      // Status broadcast — admin tracking board + trip room subscribers
      io.to(`trip:${tripId}`).emit("trip_status_update", { tripId, status: "in_progress" });
      io.to("admin_tracking").emit("trip_status_update", { tripId, status: "in_progress" });

      // tripStarted — unlocks student chat & starts map tracking
      // Emit globally so any connected student receives it,
      // also targeted to the specific trip room and route room.
      const tripStartedPayload = { tripId, routeId };
      io.emit("tripStarted", tripStartedPayload);
      io.to(`trip:${tripId}`).emit("tripStarted", tripStartedPayload);
      io.to(`route:${routeId}`).emit("tripStarted", tripStartedPayload);

      // Legacy event kept for backwards compat
      io.emit("trip_started", { routeId });
      io.to(`route:${routeId}`).emit("trip_started", { routeId });
      io.to(`trip:${tripId}`).emit("trip_started", { routeId });
    } catch (_) { /* socket may not be initialized in tests */ }

    res.json({ message: "Trip started", trip });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Update Live Location (HTTP fallback)
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    trip.current_location = { lat, lng, last_updated: new Date() };
    await trip.save();

    res.json({ message: "Location updated", trip });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// End Trip — called by driver OR admin
export const endTrip = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    trip.status = "completed";
    await trip.save();

    // Notify all clients the trip ended
    try {
      const io = getIO();
      io.to(`trip:${trip._id}`).emit("trip_status_update", { tripId: trip._id, status: "completed" });
      io.to("admin_tracking").emit("trip_status_update", { tripId: trip._id, status: "completed" });
    } catch (_) { /* socket may not be init in tests */ }

    res.json({ message: "Trip ended", trip });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get Monthly Quota Information
export const getMonthlyQuota = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const monthYear = `${month}-${year}`;

    // 1. Define start and end of current month
    const startDate = new Date(year, today.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, today.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    const queryFilter = {
      departure_time: { $gte: startDate, $lte: endDate },
      bus_number: { $exists: true, $nin: [null, ""] },
      status: { $ne: 'cancelled' },
      isArchived: { $ne: true }
    };

    // 2. Dynamic Count: Count trips that have actively consumed a bus
    const calculatedCount = await Trip.countDocuments(queryFilter);

    // 3. Auto-correct the Quota Ledger
    const systemSettings = (await SystemSettings.findOne()) ?? (await SystemSettings.create({}));
    const quota = await Quota.findOneAndUpdate(
      { monthYear },
      { 
        $set: { usedCapacity: calculatedCount },
        $setOnInsert: { totalCapacity: systemSettings.monthlyBusQuota } 
      },
      { returnDocument: 'after', upsert: true }
    );

    console.log("--- QUOTA DEBUG ---");
    console.log("Start Date:", startDate, "| End Date:", endDate);
    console.log("Executed Query Filter:", JSON.stringify(queryFilter));
    console.log("Calculated Assigned Buses:", calculatedCount);
    console.log("-------------------");

    return res.status(200).json({
      usedCapacity: calculatedCount,
      totalCapacity: quota?.totalCapacity || systemSettings.monthlyBusQuota
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};