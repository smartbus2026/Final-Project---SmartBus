"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const Trip_1 = __importDefault(require("../models/Trip"));
let ioInstance = null;
const initSocket = (httpServer) => {
    ioInstance = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PATCH"],
        },
    });
    ioInstance.on("connection", (socket) => {
        // ── User personal room ──────────────────────────────────────────────────────
        socket.on("join-user-room", (userId) => {
            if (userId)
                socket.join(`user:${userId}`);
        });
        socket.on("leave-user-room", (userId) => {
            if (userId)
                socket.leave(`user:${userId}`);
        });
        // ── Route rooms ─────────────────────────────────────────────────────────────
        socket.on("join-route-room", (routeId) => {
            if (routeId)
                socket.join(`route:${routeId}`);
        });
        socket.on("leave-route-room", (routeId) => {
            if (routeId)
                socket.leave(`route:${routeId}`);
        });
        // ── Trip rooms (students & admin tracking subscribe here) ────────────────────
        socket.on("join-trip-room", (tripId) => {
            if (tripId)
                socket.join(`trip:${tripId}`);
        });
        // Alias to match explicit business logic naming
        socket.on("join_trip_room", (tripId) => {
            if (tripId)
                socket.join(`trip:${tripId}`);
        });
        socket.on("leave-trip-room", (tripId) => {
            if (tripId)
                socket.leave(`trip:${tripId}`);
        });
        // ── Generic room helpers (legacy) ───────────────────────────────────────────
        socket.on("joinRoom", (roomId) => {
            if (roomId)
                socket.join(roomId);
        });
        socket.on("leaveRoom", (roomId) => {
            if (roomId)
                socket.leave(roomId);
        });
        // ── Admin tracking room ──────────────────────────────────────────────────────
        socket.on("join-admin-tracking", () => {
            socket.join("admin_tracking");
        });
        socket.on("join-admins", () => {
            socket.join("admins");
        });
        socket.on("leave-admin-tracking", () => {
            socket.leave("admin_tracking");
        });
        // ── REAL GPS: driver broadcasts live location ────────────────────────────────
        // Payload: { trip_id: string, lat: number, lng: number }
        socket.on("driver_location_update", async (payload) => {
            const { trip_id, lat, lng } = payload;
            if (!trip_id || lat === undefined || lng === undefined)
                return;
            // 1. Persist to DB so late-joining clients get the latest coords
            try {
                await Trip_1.default.findByIdAndUpdate(trip_id, {
                    current_location: { lat, lng, last_updated: new Date() }
                });
            }
            catch (err) {
                console.error("[socket] Failed to persist driver location:", err);
            }
            // VERIFICATION LOG REQUIRED BY USER
            console.log("Broadcasting location to room:", trip_id);
            // 2. Forward to all subscribers — admin tracking board + every student
            //    who has joined the trip room (trip:<id>)
            ioInstance?.to(`trip:${trip_id}`).emit("bus_location_updated", { lat, lng });
            // Keep admin_tracking updated (sending tripId so admin knows which bus moved)
            ioInstance?.to("admin_tracking").emit("bus_location_updated", { tripId: trip_id, lat, lng });
        });
        // ── REAL GPS: driver broadcasts live location (bus_location_update) ─────────────────
        // Payload: { busId: string, driverId: string, routeId: string, lat: number, lng: number, tripId?: string }
        socket.on("bus_location_update", async (payload) => {
            const { busId, driverId, routeId, lat, lng, tripId } = payload;
            if (lat === undefined || lng === undefined)
                return;
            let activeTripId = tripId;
            // 1. Persist to DB so late-joining clients get the latest coords
            try {
                let trip = null;
                if (tripId) {
                    trip = await Trip_1.default.findById(tripId);
                }
                else {
                    // Fallback query using active trip for driver
                    trip = await Trip_1.default.findOne({
                        driver: driverId,
                        status: { $in: ["in-progress", "in_progress", "active"] }
                    });
                }
                if (trip) {
                    activeTripId = trip._id.toString();
                    await Trip_1.default.findByIdAndUpdate(trip._id, {
                        current_location: { lat, lng, last_updated: new Date() }
                    });
                }
            }
            catch (err) {
                console.error("[socket] Failed to update trip location:", err);
            }
            console.log(`[GPS bus_location_update] Emitting for trip: ${activeTripId}`);
            // 2. Forward to subscribers
            if (activeTripId) {
                // Forward to student trip room
                ioInstance?.to(`trip:${activeTripId}`).emit("bus_location_updated", { lat, lng });
                // Forward to admin live tracking matching expected schema
                ioInstance?.to("admin_tracking").emit("bus_location_update", {
                    tripId: activeTripId,
                    busId,
                    driverId,
                    routeId,
                    location: { lat, lng },
                    lat,
                    lng
                });
                // Broadcast bus_location_update globally so student dashboards can filter by routeId
                ioInstance?.emit("bus_location_update", {
                    busId,
                    driverId,
                    routeId,
                    lat,
                    lng,
                    tripId: activeTripId
                });
            }
        });
    });
    return ioInstance;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!ioInstance)
        throw new Error("Socket.io was not initialized");
    return ioInstance;
};
exports.getIO = getIO;
