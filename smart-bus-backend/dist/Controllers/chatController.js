"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = exports.sendMessage = void 0;
const mongoose_1 = __importDefault(require("mongoose")); // 🟢 لازم نستورد mongoose للتحقق من الـ ID
const chat_1 = __importDefault(require("../models/chat"));
const Booking_model_1 = __importDefault(require("../models/Booking.model"));
const Trip_1 = __importDefault(require("../models/Trip"));
const socket_1 = require("../socket");
const sendMessage = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { message } = req.body;
        // 🟢 1. التحقق إن الـ tripId مبعوث صح ومش كلمة "default"
        if (!mongoose_1.default.Types.ObjectId.isValid(tripId)) {
            return res.status(400).json({ message: "Invalid Trip ID format. Received: " + tripId });
        }
        const trip = await Trip_1.default.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found." });
        }
        const timeSlotMap = {
            "morning": "Morning",
            "return_1530": "Return",
            "return_1900": "Return"
        };
        // Validate if user has booked this trip
        const userBooking = await Booking_model_1.default.findOne({
            route: trip.route,
            date: trip.date,
            timeSlot: timeSlotMap[trip.time_slot],
            user: req.user.id,
            status: { $in: ["active", "pending", "completed"] }
        });
        if (!userBooking && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not registered for this route on this date." });
        }
        let newMessage = await chat_1.default.create({
            sender: req.user.id, //[cite: 6]
            trip: tripId, //[cite: 6]
            message //[cite: 6]
        });
        newMessage = await newMessage.populate("sender", "name"); //[cite: 1, 6]
        // إرسال الرسالة عبر السوكيت[cite: 4, 6]
        (0, socket_1.getIO)().to(`trip:${tripId}`).emit("new-message", newMessage); //[cite: 4, 6]
        res.status(201).json(newMessage); //[cite: 6]
    }
    catch (err) {
        console.error("[Chat Controller Error]:", err.message); // عشان تشوفي الخطأ في الـ Terminal
        res.status(500).json({ error: err.message }); //[cite: 6]
    }
};
exports.sendMessage = sendMessage;
const getMessages = async (req, res) => {
    try {
        const { tripId } = req.params;
        // 🟢 2. نفس التحقق هنا لمنع الـ 500 Error
        if (!mongoose_1.default.Types.ObjectId.isValid(tripId)) {
            return res.status(400).json({ message: "Invalid Trip ID format." });
        }
        const trip = await Trip_1.default.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found." });
        }
        const timeSlotMap = {
            "morning": "Morning",
            "return_1530": "Return",
            "return_1900": "Return"
        };
        // Validate if user has booked this trip
        const userBooking = await Booking_model_1.default.findOne({
            route: trip.route,
            date: trip.date,
            timeSlot: timeSlotMap[trip.time_slot],
            user: req.user.id,
            status: { $in: ["active", "pending", "completed"] }
        });
        if (!userBooking && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not registered for this route on this date." });
        }
        const messages = await chat_1.default.find({ trip: tripId }).sort({ createdAt: 1 }).populate("sender", "name"); //[cite: 1, 6]
        res.json(messages); //[cite: 6]
    }
    catch (err) {
        console.error("[Chat Controller Error]:", err.message);
        res.status(500).json({ error: err.message }); //[cite: 6]
    }
};
exports.getMessages = getMessages;
