"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNotificationJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const User_1 = __importDefault(require("../models/User"));
const Booking_model_1 = __importDefault(require("../models/Booking.model"));
const Settings_model_1 = __importDefault(require("../models/Settings.model"));
const notification_1 = __importDefault(require("../models/notification"));
const startNotificationJobs = () => {
    // Run every minute to check for deadlines
    node_cron_1.default.schedule("* * * * *", async () => {
        try {
            const settings = await Settings_model_1.default.findOne();
            if (!settings)
                return;
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            // Determine Deadline Time
            const deadlineDate = new Date();
            deadlineDate.setHours(settings.booking_close_hour, settings.booking_close_minute, 0, 0);
            // Determine Reminder Time (30 mins before)
            const reminderDate = new Date(deadlineDate.getTime() - 30 * 60 * 1000);
            const reminderHour = reminderDate.getHours();
            const reminderMinute = reminderDate.getMinutes();
            // Today range for booking checks
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            // 1. Student Reminder (30 mins before deadline)
            if (currentHour === reminderHour && currentMinute === reminderMinute) {
                // Find users who have booked for today
                const bookingsToday = await Booking_model_1.default.find({ date: { $gte: todayStart, $lte: todayEnd } }).select("user");
                const userIdsWithBooking = bookingsToday.map((b) => b.user.toString());
                // Find students who haven't booked
                const studentsWithoutBooking = await User_1.default.find({
                    role: "student",
                    _id: { $nin: userIdsWithBooking },
                });
                if (studentsWithoutBooking.length > 0) {
                    const notifications = studentsWithoutBooking.map((student) => ({
                        user: student._id,
                        title: "Booking Reminder",
                        message: "Alert: Booking window closes in 30 minutes! Please book your trip now.",
                        type: "general",
                        read: false,
                    }));
                    await notification_1.default.insertMany(notifications);
                    console.log(`[Job] Sent reminders to ${notifications.length} students.`);
                }
            }
            // 2. Admin Alert (At deadline)
            if (currentHour === settings.booking_close_hour && currentMinute === settings.booking_close_minute) {
                // Find users who have booked for today
                const bookingsToday = await Booking_model_1.default.find({ date: { $gte: todayStart, $lte: todayEnd } }).select("user");
                const userIdsWithBooking = bookingsToday.map((b) => b.user.toString());
                const studentsWithoutBooking = await User_1.default.find({
                    role: "student",
                    _id: { $nin: userIdsWithBooking },
                });
                if (studentsWithoutBooking.length > 0) {
                    const admins = await User_1.default.find({ role: "admin" });
                    if (admins.length > 0) {
                        const adminNotifications = admins.map((admin) => ({
                            user: admin._id,
                            title: "Booking Deadline Reached",
                            message: `Alert: Booking window closed. Please review unassigned students for today. (${studentsWithoutBooking.length} students missed the deadline).`,
                            type: "general",
                            read: false,
                        }));
                        await notification_1.default.insertMany(adminNotifications);
                        console.log(`[Job] Sent deadline alert to ${adminNotifications.length} admins.`);
                    }
                }
            }
        }
        catch (err) {
            console.error("Error running notification job:", err);
        }
    });
    console.log("Notification cron job scheduled.");
};
exports.startNotificationJobs = startNotificationJobs;
