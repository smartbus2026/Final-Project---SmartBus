"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationIfNotExists = exports.broadcastNotification = exports.markAsRead = exports.getNotifications = void 0;
const notification_1 = __importDefault(require("../models/notification"));
const User_1 = __importDefault(require("../models/User"));
const socket_1 = require("../socket");
const getNotifications = async (req, res) => {
    try {
        const user = req.user;
        const notifications = await notification_1.default.find({
            user: user.id
        }).sort({ createdAt: -1 });
        res.status(200).json({
            status: "success",
            data: { notifications }
        });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const notif = await notification_1.default.findById(req.params.id);
        if (!notif) {
            return res.status(404).json({ message: "Notification not found" });
        }
        notif.read = true;
        await notif.save();
        res.status(200).json({ status: "success", message: "Marked as read" });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
};
exports.markAsRead = markAsRead;
const broadcastNotification = async (req, res) => {
    try {
        const { title, message, target } = req.body;
        let query = {};
        if (target === "Students Only" || target === "student")
            query = { role: "student" };
        else if (target === "Admins Only" || target === "admin")
            query = { role: "admin" };
        const users = await User_1.default.find(query).select("_id");
        if (users.length === 0) {
            return res.status(404).json({ message: "No users found for this target group." });
        }
        const notifications = users.map(user => ({
            user: user._id,
            title,
            message,
            type: "general",
            read: false
        }));
        await notification_1.default.insertMany(notifications);
        try {
            const io = (0, socket_1.getIO)();
            if (target === "Students Only" || target === "student") {
                users.forEach(u => {
                    io.to(`user:${u._id}`).emit("new_notification", { title, message, createdAt: new Date() });
                });
            }
            else if (target === "Admins Only" || target === "admin") {
                io.to("admins").emit("new_notification", { title, message, createdAt: new Date() });
            }
            else {
                io.emit("new_notification", { title, message, createdAt: new Date() });
            }
        }
        catch (err) {
            console.error("Socket broadcast error", err);
        }
        res.status(201).json({ status: "success", message: `Broadcasted successfully to ${users.length} users.` });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
};
exports.broadcastNotification = broadcastNotification;
// ── createNotificationIfNotExists ── بتستخدمها الـ trackingController
const createNotificationIfNotExists = async ({ userId, busId, routeId, stopId, type, title, message, eventKey, }) => {
    try {
        const existing = await notification_1.default.findOne({
            user: userId,
            message: { $regex: eventKey }
        });
        if (!existing) {
            await notification_1.default.create({
                user: userId,
                title,
                message: `${message} [${eventKey}]`,
                type: "trip",
                read: false
            });
        }
    }
    catch (err) {
        console.error("createNotificationIfNotExists error:", err);
    }
};
exports.createNotificationIfNotExists = createNotificationIfNotExists;
