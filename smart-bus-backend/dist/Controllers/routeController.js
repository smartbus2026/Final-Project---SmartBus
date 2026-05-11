"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeStopFromRoute = exports.addStopToRoute = exports.deleteRoute = exports.updateRoute = exports.getAllRoutes = exports.createRoute = void 0;
const Route_1 = __importDefault(require("../models/Route"));
const stop_1 = __importDefault(require("../models/stop"));
const createRoute = async (req, res) => {
    try {
        const { name, distance, duration, stops } = req.body;
        const stopIds = [];
        if (stops && Array.isArray(stops)) {
            for (const stopName of stops) {
                let stop = await stop_1.default.findOne({ name: stopName });
                if (!stop) {
                    stop = await stop_1.default.create({ name: stopName, location: { lat: 0, lng: 0 } });
                }
                stopIds.push(stop._id);
            }
        }
        const newRoute = await Route_1.default.create({
            name,
            distance,
            duration,
            stops: stopIds
        });
        res.status(201).json(newRoute);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createRoute = createRoute;
const getAllRoutes = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query = { name: { $regex: search, $options: "i" } };
        }
        const routes = await Route_1.default.find(query).populate("stops");
        res.status(200).json({
            results: routes.length,
            data: routes,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getAllRoutes = getAllRoutes;
const updateRoute = async (req, res) => {
    try {
        const updatedRoute = await Route_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedRoute);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.updateRoute = updateRoute;
const deleteRoute = async (req, res) => {
    try {
        await Route_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Route deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.deleteRoute = deleteRoute;
const addStopToRoute = async (req, res) => {
    try {
        const { id } = req.params; // Route ID
        const { stop_name, lat, lng } = req.body;
        const route = await Route_1.default.findById(id);
        if (!route) {
            return res.status(404).json({ message: "Route not found!" });
        }
        let stop = await stop_1.default.findOne({ name: stop_name });
        if (!stop) {
            stop = await stop_1.default.create({
                name: stop_name,
                location: { lat, lng },
            });
        }
        if (route.stops.includes(stop._id)) {
            return res.status(400).json({ message: "Stop already exists in this route" });
        }
        route.stops.push(stop._id);
        await route.save();
        const updatedRoute = await Route_1.default.findById(id).populate("stops");
        res.status(201).json({
            message: "Stop added to route successfully",
            route: updatedRoute,
            stop
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.addStopToRoute = addStopToRoute;
const removeStopFromRoute = async (req, res) => {
    try {
        const { routeId, stopId } = req.params;
        const route = await Route_1.default.findById(routeId);
        if (!route) {
            return res.status(404).json({ message: "Route not found" });
        }
        route.stops = route.stops.filter((id) => id.toString() !== stopId);
        await route.save();
        res.status(200).json({ message: "Stop removed from route", route });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.removeStopFromRoute = removeStopFromRoute;
