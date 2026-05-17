//socket/index.ts
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let ioInstance: SocketIOServer | null = null;

// Store active simulation intervals to prevent duplicates
const activeSimulations = new Map<string, NodeJS.Timeout>();

const aswanRoute = [
  { lat: 24.0889, lng: 32.8998 },
  { lat: 24.0900, lng: 32.9000 },
  { lat: 24.0920, lng: 32.9010 },
  { lat: 24.0940, lng: 32.9030 },
  { lat: 24.0960, lng: 32.9050 },
  { lat: 24.0980, lng: 32.9070 },
  { lat: 24.1000, lng: 32.9090 }
];

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
        // Auto-start simulation if it's not already running
        startTripSimulation(tripId);
      }
    });

    socket.on("leave-trip-room", (tripId: string) => {
      if (tripId) {
        socket.leave(`trip:${tripId}`);
      }
    });

    socket.on("joinRoom", (roomId: string) => {
      if (roomId) socket.join(roomId);
    });

    socket.on("leaveRoom", (roomId: string) => {
      if (roomId) socket.leave(roomId);
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

export const startTripSimulation = (tripId: string) => {
  if (!ioInstance) return;
  if (activeSimulations.has(tripId)) return; // Already simulating

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
    } else if (currentIndex <= 0) {
      direction = 1;
    }
  }, 3000);

  activeSimulations.set(tripId, interval);
};

export const getIO = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error("Socket.io was not initialized");
  }

  return ioInstance;
};