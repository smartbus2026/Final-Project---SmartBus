// socket/index.ts
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import Trip from "../models/Trip";

let ioInstance: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"],
    },
  });

  ioInstance.on("connection", (socket) => {
    // ── User personal room ──────────────────────────────────────────────────────
    socket.on("join-user-room", (userId: string) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on("leave-user-room", (userId: string) => {
      if (userId) socket.leave(`user:${userId}`);
    });

    // ── Route rooms ─────────────────────────────────────────────────────────────
    socket.on("join-route-room", (routeId: string) => {
      if (routeId) socket.join(`route:${routeId}`);
    });

    socket.on("leave-route-room", (routeId: string) => {
      if (routeId) socket.leave(`route:${routeId}`);
    });

    // ── Trip rooms (students & admin tracking subscribe here) ────────────────────
    socket.on("join-trip-room", (tripId: string) => {
      if (tripId) socket.join(`trip:${tripId}`);
    });
    
    // Alias to match explicit business logic naming
    socket.on("join_trip_room", (tripId: string) => {
      if (tripId) socket.join(`trip:${tripId}`);
    });

    socket.on("leave-trip-room", (tripId: string) => {
      if (tripId) socket.leave(`trip:${tripId}`);
    });

    // ── Generic room helpers (legacy) ───────────────────────────────────────────
    socket.on("joinRoom", (roomId: string) => {
      if (roomId) socket.join(roomId);
    });

    socket.on("leaveRoom", (roomId: string) => {
      if (roomId) socket.leave(roomId);
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
    socket.on("driver_location_update", async (payload: { trip_id: string; lat: number; lng: number }) => {
      const { trip_id, lat, lng } = payload;

      if (!trip_id || lat === undefined || lng === undefined) return;

      // 1. Persist to DB so late-joining clients get the latest coords
      try {
        await Trip.findByIdAndUpdate(trip_id, {
          current_location: { lat, lng, last_updated: new Date() }
        });
      } catch (err) {
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
  });

  return ioInstance;
};

export const getIO = (): SocketIOServer => {
  if (!ioInstance) throw new Error("Socket.io was not initialized");
  return ioInstance;
};