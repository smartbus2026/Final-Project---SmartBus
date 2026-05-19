import { Request, Response } from "express";
import Booking from "../models/Booking.model";
import Route from "../models/Route";
import Trip from "../models/Trip";
import Notification from "../models/notification";
import Settings from "../models/Settings.model";
import Bus from "../models/Bus";
import { getIO } from "../socket";

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
    if (settings) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes = settings.booking_open_hour * 60 + settings.booking_open_minute;
      const closeMinutes = settings.booking_close_hour * 60 + settings.booking_close_minute;
      if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
        return res.status(400).json({
          message: `Booking is only available between ${settings.booking_open_hour}:${String(settings.booking_open_minute).padStart(2, "0")} and ${settings.booking_close_hour}:${String(settings.booking_close_minute).padStart(2, "0")}`
        });
      }
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const bookingDate = new Date(date);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (bookingDate.toDateString() !== tomorrow.toDateString()) {
      return res.status(400).json({ message: "You can only register for the next day's routes." });
    }

    const dayStart = new Date(bookingDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(bookingDate); dayEnd.setHours(23, 59, 59, 999);

    const todaysBookings = await Booking.find({
      user: user.id,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: "cancelled" }
    });

    if (todaysBookings.length >= 2) {
      return res.status(400).json({ message: "You can only have a maximum of 2 bookings per day." });
    }

    const duplicateSlot = todaysBookings.find((b: any) => b.timeSlot === timeSlot);
    if (duplicateSlot) {
      return res.status(400).json({ message: `You already have a ${timeSlot} trip booked. Please edit your existing booking instead.` });
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

    const bookings = await Booking.find({ user: user.id, date: { $gte: todayStart } })
      .populate("route")
      .sort("-createdAt");

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
    if (settings) {
      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();
      const open = settings.booking_open_hour * 60 + settings.booking_open_minute;
      const close = settings.booking_close_hour * 60 + settings.booking_close_minute;
      if (cur < open || cur > close) {
        return res.status(400).json({ message: "Booking edits are only allowed during the registration window." });
      }
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

    res.status(200).json({
      status: "success",
      message: `Successfully assigned bus to ${bookingIds.length} bookings. Students notified.`
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
      .populate("busId", "busCode driver capacity")
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
          driverName: booking.busId?.driver || "Unassigned",
          timeSlot: timeSlot,
          specificReturnTime: booking.specificReturnTime || null,
          passengerCount: 0,
          students: [],
          date: booking.date,
          status: booking.status
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

    res.status(200).json({
      status: "success",
      data: { trips: tripsArray }
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};


