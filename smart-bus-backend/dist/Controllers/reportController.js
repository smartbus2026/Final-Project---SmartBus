"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceReport = exports.getDashboardStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Trip_1 = __importDefault(require("../models/Trip"));
const Booking_model_1 = __importDefault(require("../models/Booking.model"));
const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalTrips, activeTrips, totalBookings, utilizationData, recentActivity] = await Promise.all([
            User_1.default.countDocuments({ role: "student" }),
            Trip_1.default.countDocuments(),
            Trip_1.default.countDocuments({ status: { $in: ["active", "in-progress", "in_progress", "scheduled"] } }),
            Booking_model_1.default.countDocuments({ status: { $in: ["active", "pending", "completed"] } }),
            Trip_1.default.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBooked: { $sum: "$booked_seats" },
                        totalSeats: { $sum: "$total_seats" }
                    }
                }
            ]),
            Booking_model_1.default.find({ status: { $in: ["active", "pending", "completed"] } })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("user", "name email")
                .populate("route", "name")
        ]);
        let utilizationRate = 0;
        if (utilizationData.length > 0 && utilizationData[0].totalSeats > 0) {
            utilizationRate = Math.round((utilizationData[0].totalBooked / utilizationData[0].totalSeats) * 100);
        }
        res.json({
            totalUsers,
            totalTrips,
            activeTrips,
            totalBookings,
            utilizationRate,
            recentActivity
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getDashboardStats = getDashboardStats;
// ── Attendance Report with optional filters ─────────────────────────────────
const getAttendanceReport = async (req, res) => {
    try {
        const { date, routeId, busId, timeSlot, specificReturnTime } = req.query;
        const query = {
            attendanceStatus: { $in: ["completed", "missed"] }
        };
        // Date filter: match full day range
        if (date) {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            query.date = { $gte: dayStart, $lte: dayEnd };
        }
        if (routeId)
            query.route = routeId;
        if (busId)
            query.busId = busId;
        if (timeSlot)
            query.timeSlot = timeSlot;
        if (timeSlot === "Return" && specificReturnTime) {
            query.specificReturnTime = specificReturnTime;
        }
        const bookings = await Booking_model_1.default.find(query)
            .populate("user", "name email")
            .populate("route", "name")
            .populate("busId", "busCode")
            .sort({ date: -1 });
        const completed = bookings.filter((b) => b.attendanceStatus === "completed").length;
        const missed = bookings.filter((b) => b.attendanceStatus === "missed").length;
        const total = bookings.length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return res.status(200).json({
            status: "success",
            data: {
                bookings,
                stats: { completed, missed, total, rate }
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getAttendanceReport = getAttendanceReport;
