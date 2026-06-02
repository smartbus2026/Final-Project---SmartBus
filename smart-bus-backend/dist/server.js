"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
// Route Imports
const userRoutes_1 = __importDefault(require("./Routes/userRoutes"));
const routeRoutes_1 = __importDefault(require("./Routes/routeRoutes"));
const tripRoutes_1 = __importDefault(require("./Routes/tripRoutes"));
const bookingRoutes_1 = __importDefault(require("./Routes/bookingRoutes"));
const chatRoutes_1 = __importDefault(require("./Routes/chatRoutes"));
const supportRoutes_1 = __importDefault(require("./Routes/supportRoutes"));
const reportRoutes_1 = __importDefault(require("./Routes/reportRoutes"));
const auth_routes_1 = __importDefault(require("./Routes/auth.routes"));
const notificationsRoutes_1 = __importDefault(require("./Routes/notificationsRoutes"));
const settingsRoutes_1 = __importDefault(require("./Routes/settingsRoutes"));
const aiRoutes_1 = __importDefault(require("./Routes/aiRoutes"));
const trackingRoutes_1 = __importDefault(require("./Routes/trackingRoutes"));
const busRoutes_1 = __importDefault(require("./Routes/busRoutes"));
const driverRoutes_1 = __importDefault(require("./Routes/driverRoutes"));
const adminRoutes_1 = __importDefault(require("./Routes/adminRoutes"));
// Socket Integration
const socket_1 = require("./socket");
(0, db_1.default)();
// Start cron jobs after DB connection
const tripReminder_1 = require("./jobs/tripReminder");
const notificationJob_1 = require("./jobs/notificationJob");
(0, tripReminder_1.startTripReminderJob)();
(0, notificationJob_1.startNotificationJobs)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
const server = http_1.default.createServer(app);
(0, socket_1.initSocket)(server);
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
// API Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/routes", routeRoutes_1.default);
app.use("/api/trips", tripRoutes_1.default);
app.use("/api/bookings", bookingRoutes_1.default);
app.use("/api/notifications", notificationsRoutes_1.default);
app.use("/api/chat", chatRoutes_1.default);
app.use("/api/support", supportRoutes_1.default);
app.use("/api/reports", reportRoutes_1.default);
app.use("/api/settings", settingsRoutes_1.default);
app.use("/api/ai", aiRoutes_1.default);
app.use("/api/tracking", trackingRoutes_1.default);
app.use("/api/buses", busRoutes_1.default);
app.use("/api/driver", driverRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.get("/", (_req, res) => {
    res.json({ status: "ok", message: "SmartBus API is running" });
});
// 404 Handler
app.use((_req, res) => {
    res.status(404).json({ status: "error", message: "Route not found" });
});
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error("[ERROR]", err.message);
    res.status(err.status || 500).json({
        status: "error",
        message: err.message || "Internal Server Error",
    });
});
server.listen(PORT, () => {
    console.log(`✅ Server & Socket.io running on port ${PORT}`);
});
