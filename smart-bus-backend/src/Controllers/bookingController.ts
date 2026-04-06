import { Request, Response } from "express";
import Booking from "../models/Booking";
import Trip from "../models/Trip";
import Notification from "../models/notification";

export const createBooking = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { trip_id, pickup_point, seat_number } = req.body;

    const trip: any = await Trip.findById(trip_id).populate({
      path: "route",
      populate: { path: "stops" }
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (!trip.route || !trip.route.stops) {
      return res.status(400).json({ message: "Route has no stops" });
    }

    const validStop = trip.route.stops.find(
      (s: any) => s.name.toLowerCase() === pickup_point.toLowerCase()
    );

    if (!validStop) {
      return res.status(400).json({ message: "Invalid pickup point" });
    }

    const existingBooking = await Booking.findOne({
      user: user.id,
      trip: trip_id,
      status: { $ne: "cancelled" }
    });

    if (existingBooking) {
      return res.status(400).json({ message: "You already have an active booking for this trip" });
    }

    if (seat_number > trip.total_seats || seat_number < 1) {
      return res.status(400).json({ message: "Invalid seat number" });
    }

    const seatTaken = await Booking.findOne({
      trip: trip_id,
      seat_number,
      status: { $ne: "cancelled" },
    });

    if (seatTaken) {
      return res.status(400).json({ message: "Seat already taken" });
    }

    const booking = await Booking.create({
      user: user.id,
      trip: trip_id,
      pickup_point,
      seat_number,
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

    if (booking.user.toString() !== user.id && user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
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