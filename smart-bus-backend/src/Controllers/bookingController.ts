import { Request, Response } from "express";
import Booking from "../models/Booking";
import Trip from "../models/Trip";
import Notification from "../models/notification";

//  Create Booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { trip_id, pickup_point, seat_number } = req.body;

    //  check if trip exists + populate route + stops
    const trip: any = await Trip.findById(trip_id).populate({
      path: "route",
      populate: { path: "stops" }
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    //  validate route + stops
    if (!trip.route || !trip.route.stops) {
      return res.status(400).json({ message: "Route has no stops" });
    }

    const validStop = trip.route.stops.find(
      (s: any) =>
        s.name.toLowerCase() === pickup_point.toLowerCase()
    );

    if (!validStop) {
      return res.status(400).json({ message: "Invalid pickup point" });
    }

    //  prevent duplicate booking
   const existingBooking = await Booking.findOne({
  user: user.id,
  trip: trip_id,
});

    if (existingBooking) {
      return res.status(400).json({ message: "You already booked this trip" });
    }

    //  check seat range
    if (seat_number > trip.total_seats || seat_number < 1) {
      return res.status(400).json({ message: "Invalid seat number" });
    }

    //  check seat availability
const seatTaken = await Booking.findOne({
  trip: trip_id,
  seat_number,
  status: { $ne: "cancelled" },
});

    if (seatTaken) {
      return res.status(400).json({ message: "Seat already taken" });
    }

    //  create booking
  const booking = await Booking.create({
  user: user.id,
  trip: trip_id,
  pickup_point,
  seat_number,
});

    //  update booked seats
    trip.booked_seats += 1;
    await trip.save();

    //  send notification AFTER success
    await Notification.create({
      user: user.id,
      title: "Booking Confirmed",
      message: "Your seat has been booked successfully",
      type: "booking",
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


//    Get My Bookings
export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

  const bookings = await Booking.find({ user: user.id }).populate("trip");

    res.json(bookings);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


//    Get All Bookings
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("trip_id");

    res.json(bookings);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


//  Cancel Booking
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const booking: any = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // only owner can cancel
    if (booking.user.toString() !== user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully" });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};