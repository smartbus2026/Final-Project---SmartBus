"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Trip_1 = __importDefault(require("../models/Trip"));
const Booking_model_1 = __importDefault(require("../models/Booking.model"));
const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalTrips, activeTrips, totalBookings, utilizationData, recentActivity] = await Promise.all([
            User_1.default.countDocuments({ role: "student" }),
            Trip_1.default.countDocuments(),
            Trip_1.default.countDocuments({ status: { $in: ["active", "scheduled"] } }),
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
