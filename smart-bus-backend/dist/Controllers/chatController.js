"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = exports.sendMessage = void 0;
const chat_1 = __importDefault(require("../models/chat"));
const sendMessage = async (req, res) => {
    try {
        const { tripId, message } = req.body;
        const newMessage = await chat_1.default.create({
            sender: req.user.id,
            trip: tripId,
            message
        });
        res.status(201).json(newMessage);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.sendMessage = sendMessage;
const getMessages = async (req, res) => {
    try {
        const { tripId } = req.params;
        const messages = await chat_1.default.find({ trip: tripId }).sort({ createdAt: 1 });
        res.json(messages);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getMessages = getMessages;
