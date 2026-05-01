"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBusLocation = exports.getRouteTrackingData = exports.getActiveBuses = exports.getBusData = void 0;
const Bus_1 = __importDefault(require("../models/Bus"));
const Route_1 = __importDefault(require("../models/Route"));
const stop_1 = __importDefault(require("../models/stop"));
const User_1 = __importDefault(require("../models/User"));
const socket_1 = require("../socket");
const eta_1 = require("../utils/eta");
const notificationController_1 = require("./notificationController");
const BUS_POPULATE = [
    { path: "route", select: "name distance duration stops" },
    { path: "currentStop", select: "name location" },
    { path: "nextStop", select: "name location" },
];
const getBusData = async (req, res) => {
    try {
        const { busId } = req.params;
        const bus = await Bus_1.default.findById(busId).populate(BUS_POPULATE);
        if (!bus) {
            return res.status(404).json({ message: "Bus not found" });
        }
        res.status(200).json({ data: bus });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getBusData = getBusData;
const getActiveBuses = async (req, res) => {
    try {
        const routeId = typeof req.query.routeId === "string" ? req.query.routeId : undefined;
        const query = routeId ? { route: routeId, isActive: true } : { isActive: true };
        const buses = await Bus_1.default.find(query).populate(BUS_POPULATE);
        res.status(200).json({ results: buses.length, data: buses });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getActiveBuses = getActiveBuses;
const getRouteTrackingData = async (req, res) => {
    try {
        const { routeId } = req.params;
        const route = await Route_1.default.findById(routeId).populate("stops");
        if (!route) {
            return res.status(404).json({ message: "Route not found" });
        }
        const buses = await Bus_1.default.find({ route: routeId, isActive: true }).populate([
            { path: "currentStop", select: "name location" },
            { path: "nextStop", select: "name location" },
        ]);
        res.status(200).json({ data: { route, buses } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getRouteTrackingData = getRouteTrackingData;
const updateBusLocation = async (req, res) => {
    try {
        const { busId } = req.params;
        const { lat, lng, speedKmh, currentStopId, nextStopId, etaMinutes } = req.body;
        if (typeof lat !== "number" || typeof lng !== "number") {
            return res.status(400).json({ message: "lat and lng must be valid numbers" });
        }
        const bus = await Bus_1.default.findById(busId).populate(BUS_POPULATE);
        if (!bus) {
            return res.status(404).json({ message: "Bus not found" });
        }
        const previousEta = bus.etaMinutes;
        const previousCurrentStop = bus.currentStop
            ? String(bus.currentStop?._id ?? bus.currentStop)
            : undefined;
        const previousNextStop = bus.nextStop
            ? String(bus.nextStop?._id ?? bus.nextStop)
            : undefined;
        const nextStop = nextStopId ? await stop_1.default.findById(nextStopId) : null;
        const computedEta = typeof etaMinutes === "number"
            ? etaMinutes
            : nextStop
                ? (0, eta_1.estimateEtaMinutes)((0, eta_1.calculateDistanceKm)({ lat, lng }, nextStop.location), typeof speedKmh === "number" ? speedKmh : bus.speedKmh)
                : undefined;
        bus.currentLocation = { lat, lng };
        if (typeof speedKmh === "number") {
            bus.speedKmh = speedKmh;
        }
        if (currentStopId) {
            bus.currentStop = currentStopId;
        }
        if (nextStopId) {
            bus.nextStop = nextStopId;
        }
        bus.etaMinutes = computedEta;
        bus.lastGpsUpdateAt = new Date();
        await bus.save();
        await bus.populate(BUS_POPULATE);
        const io = (0, socket_1.getIO)();
        const routeId = bus.route?._id?.toString?.() ?? "";
        const nextStopObject = bus.nextStop;
        const currentStopObject = bus.currentStop;
        const currentStopNow = currentStopObject?._id
            ? String(currentStopObject._id)
            : currentStopObject
                ? String(currentStopObject)
                : undefined;
        const nextStopNow = nextStopObject?._id
            ? String(nextStopObject._id)
            : nextStopObject
                ? String(nextStopObject)
                : undefined;
        io.emit("bus-location-update", { busId: bus._id, location: bus.currentLocation, speedKmh: bus.speedKmh, updatedAt: bus.lastGpsUpdateAt });
        io.to(`route:${routeId}`).emit("bus-location-update", { busId: bus._id, location: bus.currentLocation, speedKmh: bus.speedKmh, updatedAt: bus.lastGpsUpdateAt });
        io.emit("stop-update", {
            busId: bus._id,
            currentStop: bus.currentStop,
            nextStop: bus.nextStop,
            routeId,
            updatedAt: bus.lastGpsUpdateAt,
        });
        io.to(`route:${routeId}`).emit("stop-update", {
            busId: bus._id,
            currentStop: bus.currentStop,
            nextStop: bus.nextStop,
            routeId,
            updatedAt: bus.lastGpsUpdateAt,
        });
        io.emit("eta-update", {
            busId: bus._id,
            etaMinutes: bus.etaMinutes,
            routeId,
            updatedAt: bus.lastGpsUpdateAt,
        });
        io.to(`route:${routeId}`).emit("eta-update", {
            busId: bus._id,
            etaMinutes: bus.etaMinutes,
            routeId,
            updatedAt: bus.lastGpsUpdateAt,
        });
        const recipients = await User_1.default.find({ role: "student" }).select("_id");
        const recipientIds = recipients.map((user) => String(user._id));
        const busCode = bus.busCode;
        if (bus.etaMinutes !== undefined && bus.etaMinutes !== previousEta) {
            await Promise.all(recipientIds.map((userId) => (0, notificationController_1.createNotificationIfNotExists)({
                userId,
                busId: String(bus._id),
                routeId,
                stopId: nextStopNow,
                type: "ETA_UPDATE",
                title: `ETA updated for bus ${busCode}`,
                message: `Bus ${busCode} ETA is now ${bus.etaMinutes} minutes.`,
                eventKey: `eta:${String(bus._id)}:${nextStopNow ?? "none"}:${bus.etaMinutes}`,
            })));
        }
        if (previousCurrentStop && currentStopNow && previousCurrentStop !== currentStopNow) {
            await Promise.all(recipientIds.map((userId) => (0, notificationController_1.createNotificationIfNotExists)({
                userId,
                busId: String(bus._id),
                routeId,
                stopId: currentStopNow,
                type: "ROUTE_CHANGE",
                title: `Bus ${busCode} passed a stop`,
                message: `Bus ${busCode} passed ${currentStopObject?.name ?? "a stop"} and is continuing on route.`,
                eventKey: `route-change:${String(bus._id)}:${currentStopNow}`,
            })));
        }
        if (nextStopNow) {
            const targetStop = await stop_1.default.findById(nextStopNow);
            if (targetStop) {
                const distanceToNextStop = (0, eta_1.calculateDistanceKm)({ lat, lng }, targetStop.location);
                if (distanceToNextStop <= 0.2) {
                    await Promise.all(recipientIds.map((userId) => (0, notificationController_1.createNotificationIfNotExists)({
                        userId,
                        busId: String(bus._id),
                        routeId,
                        stopId: nextStopNow,
                        type: "BUS_ARRIVAL",
                        title: `Bus ${busCode} is near ${targetStop.name}`,
                        message: `Bus ${busCode} is approaching ${targetStop.name}. Please be ready.`,
                        eventKey: `arrival:${String(bus._id)}:${nextStopNow}`,
                    })));
                }
            }
        }
        res.status(200).json({ data: bus });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateBusLocation = updateBusLocation;
