import express, { Request, Response, NextFunction } from "express";
import http from "http";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import connectDB from "./config/db";

// Route Imports
import userRoutes from "./routes/userRoutes";
import routeRoutes from "./routes/routeRoutes";
import tripRoutes from "./routes/tripRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import chatRoutes from "./routes/chatRoutes";
import supportRoutes from "./routes/supportRoutes";
import reportRoutes from "./routes/reportRoutes";
import authRoutes from "./routes/auth.routes";
import notificationRoutes from "./routes/notificationsRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import aiRoutes from "./routes/aiRoutes";

// Socket Integration
import { initSocket } from "./socket";


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
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/ai", aiRoutes);

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

