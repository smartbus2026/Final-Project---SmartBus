"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.startTripSimulation = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let ioInstance = null;
// Store active simulation intervals to prevent duplicates
const activeSimulations = new Map();
const aswanRoute = [
    { lat: 24.0889, lng: 32.8998 },
    { lat: 24.0900, lng: 32.9000 },
    { lat: 24.0920, lng: 32.9010 },
    { lat: 24.0940, lng: 32.9030 },
    { lat: 24.0960, lng: 32.9050 },
    { lat: 24.0980, lng: 32.9070 },
    { lat: 24.1000, lng: 32.9090 }
];
const initSocket = (httpServer) => {
    ioInstance = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PATCH"],
        },
    });
    ioInstance.on("connection", (socket) => {
        socket.on("join-user-room", (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
            }
        });
        socket.on("leave-user-room", (userId) => {
            if (userId) {
                socket.leave(`user:${userId}`);
            }
        });
        socket.on("join-route-room", (routeId) => {
            if (routeId) {
                socket.join(`route:${routeId}`);
            }
        });
        socket.on("leave-route-room", (routeId) => {
            if (routeId) {
                socket.leave(`route:${routeId}`);
            }
        });
        socket.on("join-trip-room", (tripId) => {
            if (tripId) {
                socket.join(`trip:${tripId}`);
                // Auto-start simulation if it's not already running
                (0, exports.startTripSimulation)(tripId);
            }
        });
        socket.on("leave-trip-room", (tripId) => {
            if (tripId) {
                socket.leave(`trip:${tripId}`);
            }
        });
        socket.on("joinRoom", (roomId) => {
            if (roomId)
                socket.join(roomId);
        });
        socket.on("leaveRoom", (roomId) => {
            if (roomId)
                socket.leave(roomId);
        });
        socket.on("join-admin-tracking", () => {
            socket.join("admin_tracking");
        });
        socket.on("join-admins", () => {
            socket.join("admins");
        });
        socket.on("leave-admin-tracking", () => {
            socket.leave("admin_tracking");
        });
    });
    return ioInstance;
};
exports.initSocket = initSocket;
const startTripSimulation = (tripId) => {
    if (!ioInstance)
        return;
    if (activeSimulations.has(tripId))
        return; // Already simulating
    let currentIndex = 0;
    let direction = 1;
    const interval = setInterval(() => {
        const coords = aswanRoute[currentIndex];
        // Broadcast to the specific trip room and the admin room
        const eventData = { tripId, location: coords };
        ioInstance?.to(`trip:${tripId}`).emit("bus_location_update", eventData);
        ioInstance?.to("admin_tracking").emit("bus_location_update", eventData);
        // Move back and forth along the route
        currentIndex += direction;
        if (currentIndex >= aswanRoute.length - 1) {
            direction = -1;
        }
        else if (currentIndex <= 0) {
            direction = 1;
        }
    }, 3000);
    activeSimulations.set(tripId, interval);
};
exports.startTripSimulation = startTripSimulation;
const getIO = () => {
    if (!ioInstance) {
        throw new Error("Socket.io was not initialized");
    }
    return ioInstance;
};
exports.getIO = getIO;
