"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBuses = exports.getFleetQuota = exports.createBus = void 0;
const Bus_1 = __importDefault(require("../models/Bus"));
const createBus = async (req, res) => {
    try {
        const { busCode, capacity } = req.body;
        if (!busCode) {
            return res.status(400).json({ message: "Bus Code is required." });
        }
        const newBus = await Bus_1.default.create({
            busCode,
            capacity: capacity || 45,
            isActive: true,
            currentLocation: { lat: 30.0444, lng: 31.2357 }
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
const getFleetQuota = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        const Booking = (await Promise.resolve().then(() => __importStar(require("../models/Booking.model")))).default;
        // Count distinct dispatch events: each unique (busId + date + timeSlot) group
        // within the current month where a bus was actively assigned.
        const distinctDispatches = await Booking.aggregate([
            {
                $match: {
                    status: { $in: ["assigned", "active", "completed"] },
                    busId: { $exists: true, $ne: null },
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: {
                        busId: "$busId",
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        timeSlot: "$timeSlot"
                    }
                }
            },
            { $count: "total" }
        ]);
        const usedCapacity = distinctDispatches[0]?.total || 0;
        return res.status(200).json({ usedCapacity, totalCapacity: 308 });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getFleetQuota = getFleetQuota;
const getAllBuses = async (req, res) => {
    try {
        const buses = await Bus_1.default.find({});
        res.status(200).json({ results: buses.length, data: buses });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllBuses = getAllBuses;
