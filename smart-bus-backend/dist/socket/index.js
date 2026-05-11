"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let ioInstance = null;
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
    });
    return ioInstance;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!ioInstance) {
        throw new Error("Socket.io was not initialized");
    }
    return ioInstance;
};
exports.getIO = getIO;
