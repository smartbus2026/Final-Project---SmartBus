"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTripReminderJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Trip_1 = __importDefault(require("../models/Trip"));
const Booking_model_1 = __importDefault(require("../models/Booking.model"));
const notification_1 = __importDefault(require("../models/notification"));
const startTripReminderJob = () => {
    // بيشتغل كل دقيقة
    node_cron_1.default.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            const in30Min = new Date(now.getTime() + 30 * 60 * 1000);
            // جيب الـ trips اللي هتبدأ خلال 30 دقيقة
            const upcomingTrips = await Trip_1.default.find({
                date: { $gte: now, $lte: in30Min },
                status: "scheduled"
            });
            for (const trip of upcomingTrips) {
                // جيب الـ bookings بتاعت الرحلة دي
                const bookings = await Booking_model_1.default.find({
                    trip: trip._id,
                    status: "active"
                });
                for (const booking of bookings) {
                    // تحقق إن مفيش notification اتبعتت قبل كده لنفس الرحلة
                    const alreadySent = await notification_1.default.findOne({
                        user: booking.user,
                        type: "trip",
                        message: { $regex: trip._id.toString() }
                    });
                    if (!alreadySent) {
                        await notification_1.default.create({
                            user: booking.user,
                            title: "🚌 Bus Arriving Soon!",
                            message: `Your bus is arriving in 30 minutes (Trip ID: ${trip._id}). Please be ready and board the bus to mark your attendance.`,
                            type: "trip",
                            read: false
                        });
                    }
                }
            }
        }
        catch (err) {
            console.error("Trip reminder job error:", err);
        }
    });
    console.log("✅ Trip reminder cron job started");
};
exports.startTripReminderJob = startTripReminderJob;
