"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTicketStatus = exports.getAllTickets = exports.getMyTickets = exports.createTicket = void 0;
const SupportTicket_1 = __importDefault(require("../models/SupportTicket"));
const notification_1 = __importDefault(require("../models/notification"));
const User_1 = __importDefault(require("../models/User"));
const socket_1 = require("../socket");
// ── Student: Submit a new support ticket ─────────────────────────────────────
const createTicket = async (req, res) => {
    try {
        const user = req.user;
        const { subject, description } = req.body;
        if (!subject?.trim()) {
            return res.status(400).json({ message: "Subject is required." });
        }
        const ticket = await SupportTicket_1.default.create({
            user: user.id,
            subject,
            description,
        });
        // Notify all admin users about the new ticket
        const admins = await User_1.default.find({ role: "admin" }).select("_id");
        if (admins.length > 0) {
            const notifications = admins.map((admin) => ({
                user: admin._id,
                title: "New Support Ticket",
                message: `Student submitted a new ticket: "${subject}"`,
                type: "general",
                read: false,
            }));
            const savedNotifs = await notification_1.default.insertMany(notifications);
            try {
                const io = (0, socket_1.getIO)();
                savedNotifs.forEach((notif, i) => {
                    io.to(`user:${admins[i]._id}`).emit("new_notification", {
                        _id: notif._id.toString(),
                        title: notif.title,
                        message: notif.message,
                        type: notif.type,
                        read: false,
                        createdAt: notif.createdAt ?? new Date(),
                    });
                });
            }
            catch (err) {
                console.error("Socket emit error:", err);
            }
        }
        res.status(201).json({
            status: "success",
            message: "Ticket submitted successfully.",
            data: { ticket },
        });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
};
exports.createTicket = createTicket;
// ── Student: Get own tickets ──────────────────────────────────────────────────
const getMyTickets = async (req, res) => {
    try {
        const user = req.user;
        const tickets = await SupportTicket_1.default.find({ user: user.id }).sort("-createdAt");
        res.status(200).json({ status: "success", data: { tickets } });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
};
exports.getMyTickets = getMyTickets;
// ── Admin: Get all tickets ────────────────────────────────────────────────────
const getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket_1.default.find()
            .populate("user", "name email student_id")
            .sort("-createdAt");
        res.status(200).json({ status: "success", data: { tickets } });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
};
exports.getAllTickets = getAllTickets;
// ── Admin: Update ticket status ───────────────────────────────────────────────
const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["open", "pending", "resolved"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }
        const ticket = await SupportTicket_1.default.findByIdAndUpdate(id, { status }, { new: true }).populate("user", "name email");
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found." });
        }
        // Notify the student about the status change
        const savedNotif = await notification_1.default.create({
            user: ticket.user._id,
            title: "Support Ticket Updated",
            message: `Your ticket "${ticket.subject}" has been marked as ${status}.`,
            type: "general",
        });
        try {
            const io = (0, socket_1.getIO)();
            io.to(`user:${ticket.user._id}`).emit("new_notification", {
                _id: savedNotif._id.toString(),
                title: savedNotif.title,
                message: savedNotif.message,
                type: savedNotif.type,
                read: false,
                createdAt: savedNotif.createdAt ?? new Date(),
            });
        }
        catch (err) {
            console.error("Socket emit error:", err);
        }
        res.status(200).json({
            status: "success",
            message: "Ticket status updated.",
            data: { ticket },
        });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
};
exports.updateTicketStatus = updateTicketStatus;
