import { Request, Response } from "express";
import Booking from "../models/Booking.model";
import Trip from "../models/Trip";
import Notification from "../models/notification";
import Settings from "../models/Settings.model";

export const createBooking = async (req: Request, res: Response) => {
  try {
    await Booking.collection.dropIndexes();

    const user = (req as any).user;
    const { trip_id, pickup_point, return_time } = req.body;

    // تحقق من وقت البوكينج
    const settings = await Settings.findOne();
    if (settings) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes  = settings.booking_open_hour  * 60 + settings.booking_open_minute;
      const closeMinutes = settings.booking_close_hour * 60 + settings.booking_close_minute;
      if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
        return res.status(400).json({ 
          message: `Booking is only available between ${settings.booking_open_hour}:${String(settings.booking_open_minute).padStart(2,"0")} and ${settings.booking_close_hour}:${String(settings.booking_close_minute).padStart(2,"0")}` 
        });
      }
    }

    const morningTrip: any = await Trip.findById(trip_id).populate({
      path: "route",
      populate: { path: "stops" }
    });

    if (!morningTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const currentTime = new Date();
    const tripDate = new Date(morningTrip.date);
    
    const tomorrow = new Date(currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tripDate.toDateString() !== tomorrow.toDateString()) {
      return res.status(400).json({ message: "You can only register for the next day's trips." });
    }

    if (!morningTrip.route || !morningTrip.route.stops) {
      return res.status(400).json({ message: "Route has no stops" });
    }

    const validStop = morningTrip.route.stops.find(
      (s: any) => s._id.toString() === pickup_point.toString()
    );

    if (!validStop) {
      return res.status(400).json({ message: "Invalid pickup point" });
    }

    let returnTrip: any = null;
    if (return_time) {
      returnTrip = await Trip.findOne({
        route: morningTrip.route._id,
        date: morningTrip.date,
        time_slot: return_time
      });

      if (!returnTrip) {
        return res.status(404).json({ message: "Selected return trip is not available." });
      }
    }

    const userActiveBookings = await Booking.find({ 
      user: user.id, 
      status: { $ne: "cancelled" } 
    }).populate("trip");

    const newTripDay = tripDate.toDateString(); 

    let hasMorning = false;
    let hasReturn = false;

    userActiveBookings.forEach((b: any) => {
      if (!b.trip) return;
      if (new Date(b.trip.date).toDateString() === newTripDay) {
        if (b.trip.time_slot === "morning") hasMorning = true;
        else if (b.trip.time_slot.startsWith("return")) hasReturn = true;
      }
    });

    if (hasMorning) {
      return res.status(400).json({ message: "You have already booked a morning trip for this day." });
    }

    if (returnTrip && hasReturn) {
      return res.status(400).json({ 
        message: "You have already booked a return trip for this day. Registration is limited to one return trip per day." 
      });
    }

    if (morningTrip.booked_seats >= morningTrip.total_seats) {
      return res.status(400).json({ message: "Sorry, the morning trip is fully booked. No seats available." });
    }

    if (returnTrip && returnTrip.booked_seats >= returnTrip.total_seats) {
      return res.status(400).json({ message: "Sorry, the selected return trip is fully booked." });
    }

    const assignedMorningSeat = morningTrip.booked_seats + 1;
    const bookingMorning = await Booking.create({
      user: user.id,
      trip: morningTrip._id,
      pickup_point,
      seat_number: assignedMorningSeat,
    });
    morningTrip.booked_seats += 1;
    await morningTrip.save();

    const createdBookings = [bookingMorning];

    if (returnTrip) {
      const assignedReturnSeat = returnTrip.booked_seats + 1;
      const bookingReturn = await Booking.create({
        user: user.id,
        trip: returnTrip._id,
        pickup_point,
        seat_number: assignedReturnSeat,
      });
      returnTrip.booked_seats += 1;
      await returnTrip.save();
      createdBookings.push(bookingReturn);
    }

    await Notification.create({
      user: user.id,
      title: "Booking Confirmed",
      message: `Your trip(s) for ${newTripDay} have been booked successfully.`,
      type: "booking",
    });

    res.status(201).json({
      status: "success",
      message: "Booking created successfully",
      data: { bookings: createdBookings },
    });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const bookings = await Booking.find({ user: user.id })
      .populate({
        path: "trip",
        populate: { 
          path: "route",
          populate: { path: "stops" }
        }
      })
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
      .populate({
        path: "trip",
        populate: { path: "route", select: "name" }
      });

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

    const trip: any = await Trip.findById(booking.trip);
    if (trip && new Date(trip.date) < new Date()) {
      return res.status(400).json({ message: "Cannot cancel a booking for a trip that has already departed" });
    }

    booking.status = "cancelled";
    await booking.save();

    await Trip.findByIdAndUpdate(booking.trip, {
      $inc: { booked_seats: -1 }
    });

    await Notification.create({
      user: user.id,
      title: "Booking Cancelled",
      message: "Your booking has been cancelled successfully",
      type: "booking",
    });

    res.status(200).json({
      status: "success",
      message: "Booking cancelled successfully and seat released"
    });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking: any = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Cannot mark attendance for a cancelled booking" });
    }

    booking.attended = true;
    booking.status = "completed";
    await booking.save();

    res.status(200).json({
      status: "success",
      message: "Attendance marked successfully",
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
      { trip: id, attended: false, status: "active" },
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
    const absent  = allBookings.filter((b: any) => b.status === "missed").length;
    const pending = allBookings.filter((b: any) => b.attended === false && b.status === "active").length;
    const total   = allBookings.length;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      const count = await Booking.countDocuments({ createdAt: { $gte: start, $lte: end } });
      weeklyData.push({ day: days[d.getDay()], val: count, accent: i === 0 });
    }

    const occupancyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);

      const tripsOfDay = await Trip.find({ date: { $gte: start, $lte: end } });
      const totalSeats  = tripsOfDay.reduce((sum, t: any) => sum + (t.total_seats  || 0), 0);
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
          absentPct:  total > 0 ? Math.round((absent  / total) * 100) : 0,
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

    const todayTrips = await Trip.find({ date: { $gte: todayStart, $lte: todayEnd } });
    const tripIds = todayTrips.map(t => t._id);

    const bookings = await Booking.find({ trip: { $in: tripIds } })
      .populate("user", "name email")
      .populate({ path: "trip", populate: { path: "route", select: "name" } })
      .sort("seat_number");

    res.status(200).json({ status: "success", data: { bookings } });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};