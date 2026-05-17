"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBus = void 0;
const Bus_1 = __importDefault(require("../models/Bus"));
const createBus = async (req, res) => {
    try {
        const { busCode, driverName, capacity } = req.body;
        if (!busCode || !driverName) {
            return res.status(400).json({ message: "Bus Code and Driver Name are required." });
        }
        const newBus = await Bus_1.default.create({
            busCode,
            driverName,
            capacity: capacity || 45,
            isActive: true,
            currentLocation: { lat: 30.0444, lng: 31.2357 } // default location
        });
        res.status(201).json({ message: "Bus created successfully", bus: newBus });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A bus with this Code already exists." });
        }
        res.status(500).json({ error: error.message });
    }
};
exports.createBus = createBus;
