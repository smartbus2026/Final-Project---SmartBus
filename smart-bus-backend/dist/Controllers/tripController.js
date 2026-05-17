"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endTrip = exports.updateLocation = exports.startTrip = exports.deleteTrip = exports.updateTrip = exports.getTripById = exports.getTrips = exports.createTrip = void 0;
const Trip_1 = __importDefault(require("../models/Trip"));
const Route_1 = __importDefault(require("../models/Route"));
const notification_1 = __importDefault(require("../models/notification"));
const User_1 = __importDefault(require("../models/User"));
// Create Trip (Admin)
const createTrip = async (req, res) => {
    try {
        const { route_id, time_slot, departure_time, total_seats, bus_number } = req.body;
        const route = await Route_1.default.findById(route_id);
        if (!route)
            return res.status(404).json({ message: "Route not found" });
        const trip = await Trip_1.default.create({
            route: route_id,
            date: departure_time,
            time_slot,
            bus_number,
            total_seats
        });
        // ← هنا جوه الـ try وقبل الـ res
        const students = await User_1.default.find({ role: "student" }).select("_id");
        const notifications = students.map((s) => ({
            user: s._id,
            title: "New Trip Added",
            message: `A new bus trip has been scheduled for ${new Date(trip.date).toDateString()} - ${trip.time_slot}`,
            type: "trip",
            read: false
        }));
        await notification_1.default.insertMany(notifications);
        res.status(201).json(trip);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createTrip = createTrip;
//  Get All Trips — supports optional ?date=tomorrow&?status=scheduled
const getTrips = async (req, res) => {
    try {
        const filter = {};
        // Allow filtering by status
        if (req.query.status) {
            filter.status = req.query.status;
        }
        // Allow filtering to only show upcoming/today's trips for the booking page
        if (req.query.date === "tomorrow" || req.query.date === "upcoming") {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            filter.date = { $gte: start };
        }
        const trips = await Trip_1.default.find(filter).populate({
            path: "route",
            populate: {
                path: "stops",
                model: "Stop"
            }
        });
        res.json({
            results: trips.length,
            data: trips
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getTrips = getTrips;
// Get Single Trip 
const getTripById = async (req, res) => {
    try {
        const trip = await Trip_1.default.findById(req.params.id).populate({
            path: "route",
            populate: {
                path: "stops",
                model: "Stop"
            }
        });
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        res.json(trip);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getTripById = getTripById;
//    Update Trip (Admin)
const updateTrip = async (req, res) => {
    try {
        const trip = await Trip_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        res.json(trip);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.updateTrip = updateTrip;
//    Delete Trip (Admin)
const deleteTrip = async (req, res) => {
    try {
        const trip = await Trip_1.default.findByIdAndDelete(req.params.id);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        res.json({ message: "Trip deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.deleteTrip = deleteTrip;
//    Start Trip (Admin)
const startTrip = async (req, res) => {
    try {
        const trip = await Trip_1.default.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        trip.status = "active";
        trip.start_time = new Date();
        await trip.save();
        res.json({ message: "Trip started", trip });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.startTrip = startTrip;
//    Update Live Location (Tracking)
const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const trip = await Trip_1.default.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        trip.current_location = {
            lat,
            lng,
            last_updated: new Date()
        };
        await trip.save();
        res.json({ message: "Location updated", trip });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.updateLocation = updateLocation;
//    End Trip
const endTrip = async (req, res) => {
    try {
        const trip = await Trip_1.default.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        trip.status = "completed";
        await trip.save();
        res.json({ message: "Trip ended", trip });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.endTrip = endTrip;
