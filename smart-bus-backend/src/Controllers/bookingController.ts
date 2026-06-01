import { Request, Response } from "express";
import Booking from "../models/Booking.model";
import Route from "../models/Route";
import Trip from "../models/Trip";
import Notification from "../models/notification";
import Settings from "../models/Settings.model";
import Bus from "../models/Bus";
import User from "../models/User";
import { getIO } from "../socket";
import {
  NotificationManager,
  PushNotificationStrategy,
  MultiChannelStrategy,
  EmailNotificationStrategy
} from "../services/notification";

// ─── Booking-window guard ─────────────────────────────────────────────────────
// Mirrors the calcWindow() logic in BookTripPage.tsx so backend and frontend
// are always in perfect agreement about whether the window is open.
//
// The previous implementation used:
//   currentMinutes < openMinutes || currentMinutes > closeMinutes
//
// This is permanently TRUE (always blocking) when the admin configures a
// midnight-crossing window such as 23:00 → 02:30, because closeMinutes (150)
// is less than openMinutes (1380) — so the condition fires at every single
// minute of the day and every booking attempt gets a 400 response.
//
// This helper handles both cases:
//   • Same-day window  (e.g. 20:00 → 23:00): close >= open
//   • Midnight-crossing (e.g. 23:00 → 02:30): close <  open
function isWindowOpen(settings: {
  booking_open_hour: number;
  booking_open_minute: number;
  booking_close_hour: number;
  booking_close_minute: number;
}): boolean {
  const now            = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes    = settings.booking_open_hour  * 60 + settings.booking_open_minute;
  const closeMinutes   = settings.booking_close_hour * 60 + settings.booking_close_minute;

  if (closeMinutes >= openMinutes) {
    // Same-day window
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    // Midnight-crossing window: open if past opening OR before closing
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }
}

export const createBooking = async (req: Request, res: Response) => {
  try {
    await Booking.collection.dropIndexes();

    const user = (req as any).user;
    const { routeId, date, timeSlot, specificReturnTime } = req.body;

    if (!routeId || !date || !timeSlot) {
      return res.status(400).json({ message: "routeId, date, and timeSlot are required." });
    }

    if (timeSlot === "Return" && !specificReturnTime) {
      return res.status(400).json({ message: "specificReturnTime is required for Return trips." });
    }

    const settings = await Settings.findOne();
    if (settings && !isWindowOpen(settings)) {
      const fmt = (h: number, m: number) =>
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      return res.status(400).json({
        message: `Booking is only available between ${fmt(settings.booking_open_hour, settings.booking_open_minute)} and ${fmt(settings.booking_close_hour, settings.booking_close_minute)}`
      });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const bookingDate = new Date(date);

    // ── "Next-day only" restriction removed ─────────────────────────────────
    // The original guard below was:
    //   const tomorrow = new Date();
    //   tomorrow.setDate(tomorrow.getDate() + 1);
    //   if (bookingDate.toDateString() !== tomorrow.toDateString()) { return 400; }
    //
    // It blocked booking for today's active trips and prevented testing live
    // tracking. Booking is now valid for any future date (today or later).
    // The booking-window time check above (isWindowOpen) is still enforced.

    const dayStart = new Date(bookingDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(bookingDate); dayEnd.setHours(23, 59, 59, 999);

    // INJECT VALIDATION QUERIES: Find all existing bookings for this specific user_id on the EXACT SAME DATE
    const todaysBookings = await Booking.find({
      user: user.id,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: "cancelled" }
    });

    // Rule 1 (Shift Collision): If the user already has a booking for the SAME time_slot
    const duplicateSlot = todaysBookings.find((b: any) => b.timeSlot === timeSlot);
    if (duplicateSlot) {
      return res.status(400).json({ message: `You have already booked a ${timeSlot} trip for this date.` });
    }

    // Rule 2 (Max Daily Limit): If the total bookings for that day is already 2 (or more)
    if (todaysBookings.length >= 2) {
      return res.status(400).json({ message: "You have reached your maximum limit of 2 trips (1 Morning, 1 Return) for this date." });
    }

    const booking = await Booking.create({
      user: user.id,
      route: routeId,
      date: bookingDate,
      timeSlot,
      specificReturnTime: timeSlot === "Return" ? specificReturnTime : undefined,
      status: "pending"
    });

    await Notification.create({
      user: user.id,
      title: "Booking Requested",
      message: `Your booking demand for a ${timeSlot} trip on ${bookingDate.toDateString()} has been recorded.`,
      type: "booking",
    });

    console.log("Booking created successfully without date restrictions");
    res.status(201).json({
      status: "success",
      message: "Booking demand saved successfully",
      data: { bookings: [booking] },
    });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const rawBookings = await Booking.find({ user: user.id, date: { $gte: todayStart } })
      .populate("route")
      .lean()
      .sort("-createdAt");

    // Manually attach the associated Trip to each booking so the frontend can track its status
    const bookings = await Promise.all(rawBookings.map(async (b: any) => {
      let time_slot = "morning";
      if (b.timeSlot === "Return") {
        time_slot = b.specificReturnTime === "19:00" ? "return_1900" : "return_1530";
      }

      // Match the Trip based on route, date, and timeslot.
      // CRITICAL FIX: Ensure we include 'active' and 'in_progress' so the trip doesn't vanish when started!
      const trip = await Trip.findOne({
        route: b.route._id,
        date: {
          $gte: new Date(new Date(b.date).setHours(0, 0, 0, 0)),
          $lt: new Date(new Date(b.date).setHours(23, 59, 59, 999))
        },
        time_slot: time_slot,
        status: { $in: ['scheduled', 'active', 'in_progress'] }
      }).populate({ path: "route", populate: { path: "stops", model: "Stop" } }).lean();

      return { ...b, trip: trip || null };
    }));

    // VERIFICATION LOG REQUIRED BY USER
    console.log("VERIFY: Fetched Bookings Data (with attached Trips):", bookings);

    res.status(200).json({
      status: "success",
      results: bookings.length,
      data: { bookings }
    });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("route", "name");

    res.status(200).json({
      status: "success",
      results: bookings.length,
      data: { bookings }
    });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const booking: any = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== user.id && user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    if (new Date(booking.date) < new Date()) {
      return res.status(400).json({ message: "Cannot cancel a booking for a date that has already passed" });
    }

    booking.status = "cancelled";
    await booking.save();

    await Notification.create({
      user: user.id,
      title: "Booking Cancelled",
      message: "Your booking has been cancelled successfully",
      type: "booking",
    });

    res.status(200).json({
      status: "success",
      message: "Booking cancelled successfully"
    });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const updateBooking = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { routeId, timeSlot, specificReturnTime } = req.body;

    const booking: any = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== user.id) return res.status(403).json({ message: "Not authorized to edit this booking" });
    if (booking.status === "cancelled") return res.status(400).json({ message: "Cannot edit a cancelled booking" });

    const settings = await Settings.findOne();
    if (settings && !isWindowOpen(settings)) {
      return res.status(400).json({ message: "Booking edits are only allowed during the registration window." });
    }

    if (timeSlot && timeSlot !== booking.timeSlot) {
      const dayStart = new Date(booking.date); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(booking.date); dayEnd.setHours(23, 59, 59, 999);
      const conflict = await Booking.findOne({
        user: user.id,
        _id: { $ne: id } as any,
        date: { $gte: dayStart, $lte: dayEnd },
        timeSlot,
        status: { $ne: "cancelled" }
      });
      if (conflict) return res.status(400).json({ message: `You already have a ${timeSlot} booking for this date.` });
      booking.timeSlot = timeSlot;
    }

    if (routeId) booking.route = routeId;
    if (booking.timeSlot === "Return" && specificReturnTime) {
      booking.specificReturnTime = specificReturnTime;
    } else if (booking.timeSlot === "Morning") {
      booking.specificReturnTime = undefined;
    }

    await booking.save();
    const updated = await Booking.findById(id).populate("route");
    res.status(200).json({ status: "success", data: { booking: updated } });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const markAttendanceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { attendanceStatus } = req.body;

    if (!["completed", "missed"].includes(attendanceStatus)) {
      return res.status(400).json({ message: "Invalid attendance status" });
    }

    const booking: any = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Cannot mark attendance for a cancelled booking" });
    }

    booking.attendanceStatus = attendanceStatus;
    if (attendanceStatus === "completed") {
      booking.attended = true;
      booking.status = "completed";
    } else {
      booking.attended = false;
      booking.status = "missed";
    }

    await booking.save();

    res.status(200).json({
      status: "success",
      message: `Attendance marked as ${attendanceStatus}`,
      data: { booking }
    });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const closeTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    await Booking.updateMany(
      { route: trip.route, date: trip.date, timeSlot: trip.time_slot === 'morning' ? 'Morning' : 'Return', attended: false, status: { $in: ["active", "pending"] } },
      { status: "missed" }
    );

    res.status(200).json({
      status: "success",
      message: "Trip closed and missed bookings updated"
    });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const getBookingStats = async (req: Request, res: Response) => {
  try {
    const allBookings = await Booking.find({ status: { $ne: "cancelled" } });
    const present = allBookings.filter((b: any) => b.attended === true).length;
    const absent = allBookings.filter((b: any) => b.status === "missed").length;
    const pending = allBookings.filter((b: any) => b.attended === false && ["active", "pending"].includes(b.status)).length;
    const total = allBookings.length;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      const count = await Booking.countDocuments({ createdAt: { $gte: start, $lte: end } });
      weeklyData.push({ day: days[d.getDay()], val: count, accent: i === 0 });
    }

    const occupancyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);

      const tripsOfDay = await Trip.find({ date: { $gte: start, $lte: end } });
      const totalSeats = tripsOfDay.reduce((sum, t: any) => sum + (t.total_seats || 0), 0);
      const bookedSeats = tripsOfDay.reduce((sum, t: any) => sum + (t.booked_seats || 0), 0);
      const pct = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

      occupancyData.push({ day: days[d.getDay()], pct });
    }

    res.status(200).json({
      status: "success",
      data: {
        attendance: {
          present, absent, pending, total,
          presentPct: total > 0 ? Math.round((present / total) * 100) : 0,
          absentPct: total > 0 ? Math.round((absent / total) * 100) : 0,
          pendingPct: total > 0 ? Math.round((pending / total) * 100) : 0,
        },
        weeklyRegistrations: weeklyData,
        dailyOccupancy: occupancyData,
      }
    });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const getTodayBookings = async (req: Request, res: Response) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({ date: { $gte: todayStart, $lte: todayEnd } })
      .populate("user", "name email")
      .populate("route", "name")
      .sort("createdAt");

    res.status(200).json({ status: "success", data: { bookings } });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const getDemandAggregation = async (req: Request, res: Response) => {
  try {
    const targetDate = req.query.date
      ? new Date(req.query.date as string)
      : (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })();

    const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

    const pipeline: any[] = [
      {
        $match: {
          date: { $gte: dayStart, $lte: dayEnd },
          status: "pending"
        }
      },
      {
        $group: {
          _id: {
            routeId: "$route",
            timeSlot: "$timeSlot",
            specificReturnTime: { $ifNull: ["$specificReturnTime", null] }
          },
          totalStudents: { $sum: 1 },
          bookingIds: { $push: "$_id" }
        }
      },
      {
        $lookup: {
          from: "routes",
          localField: "_id.routeId",
          foreignField: "_id",
          as: "routeInfo"
        }
      },
      { $unwind: { path: "$routeInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          routeId: "$_id.routeId",
          routeName: { $ifNull: ["$routeInfo.name", "Unknown Route"] },
          timeSlot: "$_id.timeSlot",
          specificReturnTime: "$_id.specificReturnTime",
          totalStudents: 1,
          bookingIds: 1
        }
      },
      {
        $sort: { timeSlot: 1, totalStudents: -1 }
      }
    ];

    const demands = await Booking.aggregate(pipeline);

    res.status(200).json({
      status: "success",
      date: dayStart.toISOString().split("T")[0],
      data: { demands }
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const dispatchBus = async (req: Request, res: Response) => {
  try {
    const { busId, date, timeSlot, routeIds, specificReturnTime } = req.body;

    if (!busId || !date || !timeSlot || !routeIds || routeIds.length === 0) {
      return res.status(400).json({ status: "error", message: "Missing required fields for dispatch" });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ status: "error", message: "Bus not found" });

    // ── Driver Double-Booking Validation ──
    const driverId = (bus as any).driver;
    const slotMap: Record<string, "morning" | "return_1530" | "return_1900"> = {
      Morning: "morning",
      Return:  specificReturnTime === "7:00 PM" ? "return_1900" : "return_1530",
    };
    const tripTimeSlot = slotMap[timeSlot] ?? "morning";

    const existingTripForDriver = await Trip.findOne({
      driver: driverId,
      time_slot: tripTimeSlot,
      date: { $gte: targetDate, $lte: dayEnd },
      status: { $ne: "cancelled" }
    });

    if (existingTripForDriver) {
      return res.status(400).json({ 
        status: "error", 
        message: "This driver is already assigned to another trip in this time slot today. Cannot assign." 
      });
    }
    // ────────────────────────────────────────

    // Build the dynamic query
    const query: any = {
      route: { $in: routeIds },
      date: { $gte: targetDate, $lte: dayEnd },
      timeSlot: timeSlot,
      status: "pending"
    };

    if (timeSlot === "Return" && specificReturnTime) {
      query.specificReturnTime = specificReturnTime;
    }

    // Find all matching pending bookings
    const bookingsToUpdate = await Booking.find(query);

    if (bookingsToUpdate.length === 0) {
      return res.status(404).json({ status: "error", message: "No pending bookings found for the selected routes and time slot" });
    }

    const bookingIds = bookingsToUpdate.map(b => b._id);
    const userIds = [...new Set(bookingsToUpdate.map(b => b.user.toString()))];

    // Update to assigned
    await Booking.updateMany(
      { _id: { $in: bookingIds } },
      { $set: { status: "assigned", busId: busId } }
    );

    // ─────────────────────────────────────────────────────────────────────────
    // BRIDGE FIX: Create one Trip document per route so the Driver Dashboard
    // can find it via Trip.find({ driver: req.user._id }).
    // ─────────────────────────────────────────────────────────────────────────

    console.log("[DISPATCH] Bus driver ObjectId:", driverId);
    console.log("[DISPATCH] Creating Trip documents for routeIds:", routeIds);

    const tripUpserts = await Promise.all(
      routeIds.map(async (routeId: string) => {
        // Count passengers on this specific route
        const passengerCount = bookingsToUpdate.filter(
          b => b.route?.toString() === routeId
        ).length;

        // Use findOneAndUpdate with upsert so re-dispatching the same
        // route/date/slot updates the existing Trip rather than duplicating.
        const result = await Trip.findOneAndUpdate(
          {
            route:     routeId,
            driver:    driverId,
            date:      targetDate,
            time_slot: tripTimeSlot,
          },
          {
            $set: {
              bus_number:   bus.busCode,
              total_seats:  bus.capacity ?? 45,
              booked_seats: passengerCount,
              status:       "scheduled",
            },
            $setOnInsert: {
              route:     routeId,
              driver:    driverId,
              date:      targetDate,
              time_slot: tripTimeSlot,
            },
          },
          { upsert: true, new: true }
        );

        console.log(
          `[DISPATCH] Trip upserted — _id: ${result?._id} | route: ${routeId} | driver: ${driverId} | date: ${targetDate.toISOString().split("T")[0]}`
        );

        return result;
      })
    );

    console.log("[DISPATCH] Total Trip documents upserted:", tripUpserts.length);

    // Create notifications for students
    const message = `Your bus has been assigned! Bus No: ${bus.busCode} is now covering your route.`;
    const notifications = userIds.map(userId => ({
      user: userId,
      title: "Bus Assigned",
      message: message,
      type: "trip",
      read: false
    }));
    await Notification.insertMany(notifications);

    // Emit real-time events
    const socketPayload = {
      title: "Bus Assigned",
      message,
      busDetails: { _id: bus._id, busCode: bus.busCode },
      bookingIds: bookingIds.map(id => id.toString()),
      timeSlot,
      specificReturnTime: specificReturnTime || null,
      routeIds
    };

    try {
      const io = getIO();
      userIds.forEach(userId => {
        io.to(`user:${userId}`).emit("newNotification", socketPayload);
        io.to(`user:${userId}`).emit("bookingAssigned", socketPayload);
      });
      io.to("admins").emit("demandDispatched");
    } catch (socketErr) {
      console.warn("Socket.io not initialized, skipping realtime emission", socketErr);
    }

    // ── Shift Quota Warning ────────────────────────────────────────────────────
    // After a successful dispatch, count distinct bus assignments for this
    // time slot on the dispatched date and fire a notification if the soft
    // limit is exceeded.
    try {
      const SHIFT_LIMIT = 7;

      const distinctShiftAssignments = await Booking.aggregate([
        {
          $match: {
            status: { $in: ["assigned", "active", "completed"] },
            busId: { $exists: true, $ne: null },
            date: { $gte: targetDate, $lte: dayEnd },
            timeSlot: timeSlot
          }
        },
        {
          $group: {
            _id: "$busId"
          }
        },
        { $count: "total" }
      ]);

      const currentShiftCount = distinctShiftAssignments[0]?.total || 0;

      if (currentShiftCount >= SHIFT_LIMIT) {
        // ── Idempotency Check ──
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        // Ensure we haven't already notified about this exact shift/date today
        const existingWarning = await Notification.findOne({
          title: "Shift Quota Exceeded",
          message: { $regex: `${timeSlot}.*${targetDate.toDateString()}`, $options: "i" },
          createdAt: { $gte: startOfDay }
        });

        if (!existingWarning) {
          const admins = await User.find({ role: "admin" }).select("_id");
          const pushStrategy = new PushNotificationStrategy();
          const criticalStrategy = new MultiChannelStrategy([
            new PushNotificationStrategy(),
            new EmailNotificationStrategy()
          ]);
          const strategy = currentShiftCount > SHIFT_LIMIT ? criticalStrategy : pushStrategy;

          for (const admin of admins) {
            await NotificationManager.notify(
              admin._id.toString(),
              strategy,
              "Shift Quota Exceeded",
              `Warning: The capacity for the ${timeSlot} shift on ${targetDate.toDateString()} is exhausted. You have assigned ${currentShiftCount} buses, exceeding the limit of ${SHIFT_LIMIT}.`
            );
          }

          try {
            const io = getIO();
            io.to("admins").emit("newNotification", {
              title: "Shift Quota Exceeded",
              message: `Warning: ${timeSlot} shift now has ${currentShiftCount}/${SHIFT_LIMIT} buses assigned.`,
              type: "system",
              createdAt: new Date()
            });
          } catch (_) { /* socket may not be available */ }
        }
      }
    } catch (quotaErr) {
      // Non-critical — do not fail the dispatch if the quota check errors
    }
    // ─────────────────────────────────────────────────────────────────────────

    res.status(200).json({
      status: "success",
      message: `Successfully assigned bus to ${bookingIds.length} bookings and created ${tripUpserts.length} Trip(s). Students notified.`
    });
  } catch (err: any) {
    console.error("[DispatchBus Error]:", err);
    res.status(500).json({ status: "error", error: err.message || "Internal Server Error" });
  }
};

export const recoverCancelledBookings = async (req: Request, res: Response) => {
  try {
    const result = await Booking.updateMany(
      { timeSlot: "Return", status: "cancelled" },
      { $set: { status: "pending" }, $unset: { specificReturnTime: "" } }
    );
    res.status(200).json({ message: `Successfully recovered ${result.modifiedCount} cancelled return bookings back to pending.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAssignedTrips = async (req: Request, res: Response) => {
  try {
    const query: any = { status: "assigned" };

    // Optional date filter: if provided, match bookings on that exact date
    if (req.query.date) {
      const dateStr = req.query.date as string;
      const dayStart = new Date(dateStr);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dateStr);
      dayEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dayStart, $lte: dayEnd };
    }

    const assignedBookings = await Booking.find(query)
      .populate("route", "name")
      .populate({
        path: "busId",
        select: "busCode driver capacity",
        populate: { path: "driver", select: "name email" }
      })
      .populate("user", "name email");

    const groupedTrips: any = {};

    assignedBookings.forEach((booking: any) => {
      const routeId = booking.route?._id?.toString() || 'unknown-route';
      const busId = booking.busId?._id?.toString() || 'unknown-bus';
      const timeSlot = booking.timeSlot;
      const specificReturnTime = booking.specificReturnTime || 'none';

      const groupKey = `${busId}-${routeId}-${timeSlot}-${specificReturnTime}`;

      if (!groupedTrips[groupKey]) {
        groupedTrips[groupKey] = {
          id: groupKey,
          routeId: routeId,
          routeName: booking.route?.name || "Unknown Route",
          route: booking.route || null,
          busId: busId,
          busNumber: booking.busId?.busCode || "Unknown Bus",
          bus: booking.busId || null,
          driverName: booking.busId?.driver?.name || "Unassigned",
          timeSlot: timeSlot,
          specificReturnTime: booking.specificReturnTime || null,
          passengerCount: 0,
          students: [],
          date: booking.date,
          status: booking.status,
          actualIds: []
        };
      }

      groupedTrips[groupKey].passengerCount += 1;
      if (booking.user) {
        groupedTrips[groupKey].students.push({
          _id: booking.user._id,
          name: booking.user.name,
          email: booking.user.email,
          bookingId: booking._id,
        });
      }
    });

    const tripsArray = Object.values(groupedTrips);

    // INJECT FIX: Resolve the true Trip _id for each grouped booking to prevent CastError
    const Trip = (await import("../models/Trip")).default;
    for (const group of tripsArray as any[]) {
      let tripTimeSlot = "morning";
      if (group.timeSlot === "Return") {
        tripTimeSlot = group.specificReturnTime === "19:00" || group.specificReturnTime === "7:00 PM" ? "return_1900" : "return_1530";
      }
      
      const dayStart = new Date(group.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(group.date);
      dayEnd.setHours(23, 59, 59, 999);

      const realTrip = await Trip.findOne({
        route: group.routeId,
        time_slot: tripTimeSlot,
        $or: [
          { date: { $gte: dayStart, $lte: dayEnd } },
          { departure_time: { $gte: dayStart, $lte: dayEnd } }
        ]
      });

      if (realTrip) {
        group.actualTripId = realTrip._id.toString();
        group.actualIds = [realTrip._id.toString()];
        group.id = realTrip._id.toString(); // Override composite string with real MongoDB ObjectId
      }
    }

    res.status(200).json({
      status: "success",
      data: { trips: tripsArray }
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};


