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
    
    // --- User Rooms ---
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

    // --- Route Rooms ---
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

    // --- Trip Rooms ---
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

    // ==========================================
    // 🔴 جزء الـ Live Tracking والتتبع 🔴
    // ==========================================

    // 1. الأدمن بيدخل الغرفة دي عشان يراقب كل الأتوبيسات النشطة في السيستم
    socket.on("join-admin-room", () => {
      socket.join("admin-room");
    });

    socket.on("leave-admin-room", () => {
      socket.leave("admin-room");
    });

    // 2. استقبال الإحداثيات من جهاز الطالب/السواق
    socket.on("send-live-location", (data: { tripId: string; lat: number; lng: number }) => {
      if (data.tripId) {
        // أ. إرسال الإحداثيات للطلاب اللي بيراقبوا الرحلة دي تحديداً
        socket.to(`trip:${data.tripId}`).emit("bus-location-update", data);
        
        // ب. إرسال الإحداثيات لغرفة الأدمنز عشان تظهر في لوحة التحكم الرئيسية (Dashboard)
        socket.to("admin-room").emit("admin-bus-update", data);
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