import express, { Request, Response, NextFunction } from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";

// Route Imports
import userRoutes from "./Routes/userRoutes";
import routeRoutes from "./Routes/routeRoutes";
import tripRoutes from "./Routes/tripRoutes";
import bookingRoutes from "./Routes/bookingRoutes";
import chatRoutes from "./Routes/chatRoutes";
import supportRoutes from "./Routes/supportRoutes";
import reportRoutes from "./Routes/reportRoutes";
import authRoutes from "./Routes/auth.routes";
import notificationRoutes from "./Routes/notificationsRoutes";
import settingsRoutes from "./Routes/settingsRoutes";

// Socket Integration
import { initSocket } from "./socket";

dotenv.config();
connectDB();

// Start cron jobs after DB connection
import { startTripReminderJob } from "./jobs/tripReminder";
startTripReminderJob();

const app = express();
const PORT = process.env.PORT || 5001;

const server = http.createServer(app);
initSocket(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// API Routes
app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/routes",        routeRoutes);
app.use("/api/trips",         tripRoutes);
app.use("/api/bookings",      bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat",          chatRoutes);
app.use("/api/support",       supportRoutes);
app.use("/api/reports",       reportRoutes);
app.use("/api/settings",      settingsRoutes); // ← هنا قبل الـ 404

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "SmartBus API is running" });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server & Socket.io running on port ${PORT}`);
});