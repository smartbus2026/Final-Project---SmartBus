"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endTrip = exports.updateLocation = exports.startTrip = exports.deleteTrip = exports.updateTrip = exports.getTripById = exports.getTrips = exports.createTrip = void 0;
const Trip_1 = __importDefault(require("../models/Trip"));
const Route_1 = __importDefault(require("../models/Route"));
// Create Trip (Admin)
const createTrip = async (req, res) => {
    try {
        const { route_id, time_slot, departure_time, total_seats } = req.body;
        const route = await Route_1.default.findById(route_id);
        if (!route)
            return res.status(404).json({ message: "Route not found" });
        const trip = await Trip_1.default.create({
            route: route_id,
            date: departure_time,
            time_slot,
            total_seats
        });
        res.status(201).json(trip);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createTrip = createTrip;
//  Get All Trips
const getTrips = async (req, res) => {
    try {
        const trips = await Trip_1.default.find().populate({
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
