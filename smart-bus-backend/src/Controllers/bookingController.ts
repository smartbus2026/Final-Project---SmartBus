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
    const { trip_id, pickup_point, return_time } = req.body;

    const morningTrip: any = await Trip.findById(trip_id).populate({
      path: "route",
      populate: { path: "stops" }
    });

    if (!morningTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const currentTime = new Date();
    const tripDate = new Date(morningTrip.date);
    
    // Registration is for the NEXT DAY'S trip.
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
      const returnTimeSlot = return_time === "3:30 PM" ? "return_1530" : "return_1900";
      returnTrip = await Trip.findOne({
        route: morningTrip.route._id,
        date: morningTrip.date,
        time_slot: returnTimeSlot
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

    // Create Morning Booking
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

    // Create Return Booking
    if (returnTrip) {
      const assignedReturnSeat = returnTrip.booked_seats + 1;
      const bookingReturn = await Booking.create({
        user: user.id,
        trip: returnTrip._id,
        pickup_point, // Reusing pickup_point as destination/origin placeholder
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