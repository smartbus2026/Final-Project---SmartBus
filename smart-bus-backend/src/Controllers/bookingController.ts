import { Request, Response } from "express";
import Booking from "../models/Booking.model";
import Trip from "../models/Trip";
import Notification from "../models/notification";

export const createBooking = async (req: Request, res: Response) => {
    const currentHour = new Date().getHours();
    if (currentHour >= 14) { 
      return res.status(400).json({ message: "Registration is closed. It opens daily from 12:00 AM to 2:00 PM." });
    }
  try {
    const user = (req as any).user;
    // 1. Shelna el seat_number mn el req.body
    const { trip_id, pickup_point } = req.body;

    const trip: any = await Trip.findById(trip_id).populate({
      path: "route",
      populate: { path: "stops" }
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const currentTime = new Date();
    const tripDate = new Date(trip.date);
    if (tripDate < currentTime) {
      return res.status(400).json({ message: "This trip has already departed" });
    }

    if (!trip.route || !trip.route.stops) {
      return res.status(400).json({ message: "Route has no stops" });
    }

    const validStop = trip.route.stops.find(
      (s: any) => s._id.toString() === pickup_point.toString()
    );

    if (!validStop) {
      return res.status(400).json({ message: "Invalid pickup point" });
    }

    const userActiveBookings = await Booking.find({ 
      user: user.id, 
      status: { $ne: "cancelled" } 
    }).populate("trip");

    const newTripDay = tripDate.toDateString(); 

    const alreadyBookedToday = userActiveBookings.some((booking: any) => {
      if (!booking.trip) return false;
      const existingTripDay = new Date(booking.trip.date).toDateString();
      return existingTripDay === newTripDay;
    });

    if (alreadyBookedToday) {
      return res.status(400).json({ 
        message: "You have already booked a return trip for today. Registration is limited to one return trip per day." 
      });
    }

    // --- Start: NEW LOGIC FOR CAPACITY ---
    
    if (trip.booked_seats >= trip.total_seats) {
      return res.status(400).json({ message: "Sorry, this trip is fully booked. No seats available." });
    }

    const assigned_seat = trip.booked_seats + 1;
    // --- End: NEW LOGIC FOR CAPACITY ---

    const booking = await Booking.create({
      user: user.id,
      trip: trip_id,
      pickup_point,
      seat_number: assigned_seat, // Hena ednaho el raqam auto
    });

    trip.booked_seats += 1;
    await trip.save();

    await Notification.create({
      user: user.id,
      title: "Booking Confirmed",
      message: "Your seat has been booked successfully",
      type: "booking",
    });

    res.status(201).json({
      status: "success",
      message: "Booking created successfully",
      data: { booking },
    });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Fetch user bookings with nested population for UI display
    const bookings = await Booking.find({ user: user.id })
      .populate({
        path: "trip",
        populate: { path: "route", select: "name" }
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

    // Authorization: Only owner or admin can cancel
    if (booking.user.toString() !== user.id && user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Validation: Prevent cancellation if the trip has already departed
    const trip: any = await Trip.findById(booking.trip);
    if (trip && new Date(trip.date) < new Date()) {
        return res.status(400).json({ message: "Cannot cancel a booking for a trip that has already departed" });
    }

    // Update status and release seat
    booking.status = "cancelled";
    await booking.save();

    await Trip.findByIdAndUpdate(booking.trip, {
      $inc: { booked_seats: -1 }
    });

    // Generate cancellation notification
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