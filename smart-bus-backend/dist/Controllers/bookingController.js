"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBooking = exports.getAllBookings = exports.getMyBookings = exports.createBooking = void 0;
const Booking_model_1 = __importDefault(require("../models/Booking.model"));
const Trip_1 = __importDefault(require("../models/Trip"));
const notification_1 = __importDefault(require("../models/notification"));
const createBooking = async (req, res) => {
    const currentHour = new Date().getHours();
    if (currentHour >= 14) {
        return res.status(400).json({ message: "Registration is closed. It opens daily from 12:00 AM to 2:00 PM." });
    }
    try {
        const user = req.user;
        // 1. Shelna el seat_number mn el req.body
        const { trip_id, pickup_point } = req.body;
        const trip = await Trip_1.default.findById(trip_id).populate({
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
        const validStop = trip.route.stops.find((s) => s._id.toString() === pickup_point.toString());
        if (!validStop) {
            return res.status(400).json({ message: "Invalid pickup point" });
        }
        const userActiveBookings = await Booking_model_1.default.find({
            user: user.id,
            status: { $ne: "cancelled" }
        }).populate("trip");
        const newTripDay = tripDate.toDateString();
        const alreadyBookedToday = userActiveBookings.some((booking) => {
            if (!booking.trip)
                return false;
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
        const booking = await Booking_model_1.default.create({
            user: user.id,
            trip: trip_id,
            pickup_point,
            seat_number: assigned_seat, // Hena ednaho el raqam auto
        });
        trip.booked_seats += 1;
        await trip.save();
        await notification_1.default.create({
            userId: user.id,
            title: "Booking Confirmed",
            message: "Your seat has been booked successfully",
            type: "ALERT",
            isRead: false,
        });
        res.status(201).json({
            status: "success",
            message: "Booking created successfully",
            data: { booking },
        });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
};
exports.createBooking = createBooking;
const getMyBookings = async (req, res) => {
    try {
        const user = req.user;
        // Fetch user bookings with nested population for UI display
        const bookings = await Booking_model_1.default.find({ user: user.id })
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
    }
    catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
};
exports.getMyBookings = getMyBookings;
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking_model_1.default.find()
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
    }
    catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
};
exports.getAllBookings = getAllBookings;
const cancelBooking = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const booking = await Booking_model_1.default.findById(id);
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
        const trip = await Trip_1.default.findById(booking.trip);
        if (trip && new Date(trip.date) < new Date()) {
            return res.status(400).json({ message: "Cannot cancel a booking for a trip that has already departed" });
        }
        // Update status and release seat
        booking.status = "cancelled";
        await booking.save();
        await Trip_1.default.findByIdAndUpdate(booking.trip, {
            $inc: { booked_seats: -1 }
        });
        // Generate cancellation notification
        await notification_1.default.create({
            userId: user.id,
            title: "Booking Cancelled",
            message: "Your booking has been cancelled successfully",
            type: "ALERT",
            isRead: false,
        });
        res.status(200).json({
            status: "success",
            message: "Booking cancelled successfully and seat released"
        });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
};
exports.cancelBooking = cancelBooking;
