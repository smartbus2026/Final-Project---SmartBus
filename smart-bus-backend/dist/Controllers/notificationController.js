"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastNotification = exports.deleteNotification = exports.markAsRead = exports.getUnreadNotifications = exports.getNotifications = exports.createNotificationIfNotExists = void 0;
const notification_1 = __importDefault(require("../models/notification"));
const User_1 = __importDefault(require("../models/User"));
const socket_1 = require("../socket");
const serializeNotification = (notification) => ({
    id: notification._id,
    userId: notification.userId,
    busId: notification.busId,
    routeId: notification.routeId,
    stopId: notification.stopId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
});
const createNotificationIfNotExists = async (payload) => {
    try {
        const notification = await notification_1.default.findOneAndUpdate({ userId: payload.userId, eventKey: payload.eventKey }, {
            $setOnInsert: {
                userId: payload.userId,
                busId: payload.busId,
                routeId: payload.routeId,
                stopId: payload.stopId,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                isRead: false,
                eventKey: payload.eventKey,
            },
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
        if (!notification) {
            return null;
        }
        (0, socket_1.getIO)().to(`user:${payload.userId}`).emit("notification-update", serializeNotification(notification));
        (0, socket_1.getIO)().emit("notification-update", serializeNotification(notification));
        return notification;
    }
    catch (error) {
        if (error?.code === 11000) {
            return null;
        }
        throw error;
    }
};
exports.createNotificationIfNotExists = createNotificationIfNotExists;
const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await notification_1.default.find({
            userId,
        }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: notifications.map((n) => serializeNotification(n)),
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getNotifications = getNotifications;
const getUnreadNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await notification_1.default.find({
            userId,
            isRead: false,
        }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: notifications.map((n) => serializeNotification(n)),
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getUnreadNotifications = getUnreadNotifications;
const markAsRead = async (req, res) => {
    try {
        const notif = await notification_1.default.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
        if (!notif) {
            return res.status(404).json({ message: "Not found" });
        }
        (0, socket_1.getIO)().to(`user:${String(notif.userId)}`).emit("notification-read", {
            id: notif._id,
            isRead: notif.isRead,
        });
        res.status(200).json({
            success: true,
            data: serializeNotification(notif),
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.markAsRead = markAsRead;
const deleteNotification = async (req, res) => {
    try {
        const notif = await notification_1.default.findByIdAndDelete(req.params.id);
        if (!notif) {
            return res.status(404).json({ message: "Not found" });
        }
        (0, socket_1.getIO)().to(`user:${String(notif.userId)}`).emit("notification-delete", {
            id: notif._id,
        });
        res.status(200).json({
            success: true,
            message: "Notification deleted",
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.deleteNotification = deleteNotification;
// //////////////////////////////////////////////admin Notifications//////////////////////////////////////////////
const broadcastNotification = async (req, res) => {
    try {
        const { title, message, target } = req.body;
        let query = {};
        if (target === "Students Only")
            query = { role: "student" };
        else if (target === "Admins Only")
            query = { role: "admin" };
        const users = await User_1.default.find(query).select("_id");
        if (users.length === 0) {
            return res.status(404).json({ message: "No users found for this target group." });
        }
        const created = await Promise.all(users.map((user) => notification_1.default.create({
            userId: user._id,
            title,
            message,
            type: "ALERT",
            isRead: false,
        })));
        created.forEach((notification) => {
            (0, socket_1.getIO)()
                .to(`user:${String(notification.userId)}`)
                .emit("notification-update", serializeNotification(notification));
        });
        res.status(201).json({ message: `Broadcasted successfully to ${users.length} users.` });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.broadcastNotification = broadcastNotification;
