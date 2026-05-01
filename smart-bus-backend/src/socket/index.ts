//socket/index.ts
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let ioInstance: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"],
    },
  });

  ioInstance.on("connection", (socket) => {
    socket.on("join-user-room", (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on("leave-user-room", (userId: string) => {
      if (userId) {
        socket.leave(`user:${userId}`);
      }
    });

    socket.on("join-route-room", (routeId: string) => {
      if (routeId) {
        socket.join(`route:${routeId}`);
      }
    });

    socket.on("leave-route-room", (routeId: string) => {
      if (routeId) {
        socket.leave(`route:${routeId}`);
      }
    });

 
    socket.on("join-trip-room", (tripId: string) => {
      if (tripId) {
        socket.join(`trip:${tripId}`);
      }
    });

    socket.on("leave-trip-room", (tripId: string) => {
      if (tripId) {
        socket.leave(`trip:${tripId}`);
      }
    });
  });

  return ioInstance;
};

export const getIO = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error("Socket.io was not initialized");
  }

  return ioInstance;
};