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
exports.getMonthlyQuota = exports.endTrip = exports.updateLocation = exports.startTrip = exports.deleteTrip = exports.bulkDeleteTrips = exports.updateTrip = exports.getTripById = exports.getDriverTrips = exports.getTrips = exports.createTrip = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Trip_1 = __importDefault(require("../models/Trip"));
const Route_1 = __importDefault(require("../models/Route"));
const notification_1 = __importDefault(require("../models/notification"));
const User_1 = __importDefault(require("../models/User"));
const quotaModel_1 = __importDefault(require("../models/quotaModel"));
const Bus_1 = __importDefault(require("../models/Bus"));
const socket_1 = require("../socket");
const notification_2 = require("../services/notification");
const dispatchFleetAlerts = async (shiftCount, dailyCount, usedCapacity, totalCapacity, time_slot) => {
    const adminIds = await User_1.default.find({ role: "admin" }).select("_id");
    const pushStrategy = new notification_2.PushNotificationStrategy();
    const criticalStrategy = new notification_2.MultiChannelStrategy([
        new notification_2.PushNotificationStrategy(),
        new notification_2.EmailNotificationStrategy()
    ]);
    for (const admin of adminIds) {
        const adminId = admin._id.toString();
        if (shiftCount >= 7) {
            await notification_2.NotificationManager.notify(adminId, pushStrategy, "Shift Overflow Warning", `Warning: You exceeded the 7-bus limit for the ${time_slot} shift. This deducts from your return or extra balance.`);
        }
        const newDailyTotal = dailyCount + 1;
        if (newDailyTotal > 14) {
            await notification_2.NotificationManager.notify(adminId, pushStrategy, "Daily Limit Exceeded", "Alert: You exceeded the 14-bus daily limit. Deducting from future days.");
        }
        else if (newDailyTotal === 14) {
            await notification_2.NotificationManager.notify(adminId, pushStrategy, "Daily Allowance Reached", "Info: Trip scheduled successfully. You have reached your standard 14-bus allowance for today.");
        }
        else {
            await notification_2.NotificationManager.notify(adminId, pushStrategy, "Daily Pacing Info", `Info: Trip scheduled successfully. You have ${14 - newDailyTotal} buses remaining in today's standard 14-bus allowance.`);
        }
        if (usedCapacity === Math.floor(totalCapacity * 0.8)) {
            await notification_2.NotificationManager.notify(adminId, criticalStrategy, "Low Balance Alert", "Critical: You have consumed 80% of your monthly bus quota.");
        }
    }
};
// Create Trip (Admin)
const createTrip = async (req, res) => {
    try {
        const { route_id, time_slot, departure_time, total_seats, bus_number, driver } = req.body;
        const route = await Route_1.default.findById(route_id);
        if (!route)
            return res.status(404).json({ message: "Route not found" });
        const busDoc = await Bus_1.default.findOne({ busCode: bus_number });
        const tripData = {
            route: route_id,
            date: departure_time,
            time_slot,
            bus_number,
            total_seats,
        };
        if (busDoc) {
            tripData.bus = busDoc._id;
        }
        if (req.body.driver_id) {
            tripData.driver = req.body.driver_id;
        }
        else if (driver) {
            tripData.driver = driver;
        }
        if (!tripData.driver) {
            return res.status(400).json({ message: "Driver ID is strictly required" });
        }
        console.log("Saving new trip to DB with Driver ObjectId:", tripData.driver);
        // =========================================================================
        // MONTHLY QUOTA & FLEET ALLOCATION LOGIC
        // =========================================================================
        // 1. Identify current monthYear
        const tripDate = new Date(departure_time);
        const month = String(tripDate.getMonth() + 1).padStart(2, '0');
        const year = tripDate.getFullYear();
        const monthYear = `${month}-${year}`;
        // 2. Quota Initialization & Hard Limit Check
        let quota = await quotaModel_1.default.findOne({ monthYear });
        if (!quota) {
            quota = new quotaModel_1.default({ monthYear, totalCapacity: 308, usedCapacity: 0 });
        }
        if (quota.usedCapacity >= quota.totalCapacity) {
            return res.status(403).json({ message: "Monthly quota exhausted. Cannot create more trips." });
        }
        // 3. Current Day Usage Calculations (Soft Limits)
        const startOfDay = new Date(tripDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(tripDate);
        endOfDay.setHours(23, 59, 59, 999);
        const dailyCount = await Trip_1.default.countDocuments({
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        const shiftCount = await Trip_1.default.countDocuments({
            date: { $gte: startOfDay, $lte: endOfDay },
            time_slot: time_slot
        });
        // 4. Save & Increment
        quota.usedCapacity += 1;
        await quota.save();
        const trip = new Trip_1.default(tripData);
        await trip.save();
        // 5. Trigger Notifications via SOLID Multi-Channel Dispatcher
        await dispatchFleetAlerts(shiftCount, dailyCount, quota.usedCapacity, quota.totalCapacity, time_slot);
        // =========================================================================
        const students = await User_1.default.find({ role: "student" }).select("_id");
        const notifications = students.map((s) => ({
            user: s._id,
            title: "New Trip Added",
            message: `A new bus trip has been scheduled for ${new Date(trip.date).toDateString()} - ${trip.time_slot}`,
            type: "trip",
            read: false
        }));
        await notification_1.default.insertMany(notifications);
        res.status(201).json(trip);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createTrip = createTrip;
// Get All Trips — supports optional ?date=tomorrow&?status=scheduled
const getTrips = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.date === "tomorrow" || req.query.date === "upcoming") {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            filter.date = { $gte: start };
        }
        const trips = await Trip_1.default.find(filter)
            .populate({ path: "route", populate: { path: "stops", model: "Stop" } })
            .populate("driver", "name email")
            .populate("bus");
        res.json({ results: trips.length, data: trips });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getTrips = getTrips;
// Get trips assigned to the logged-in driver
// Returns each trip enriched with:
//   • route.stops   — populated Stop documents
//   • usersCount    — number of active/pending bookings on this trip
//   • scheduled_time — ISO string of trip.date for frontend time-gating
const getDriverTrips = async (req, res) => {
    try {
        const driverId = req.user?._id;
        if (!driverId)
            return res.status(401).json({ message: "Unauthorized" });
        // Filter by today and upcoming future dates
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const filter = {
            driver: driverId,
            date: { $gte: startOfToday }
        };
        // Default: only active and scheduled trips
        if (!req.query.all) {
            filter.status = { $in: ["scheduled", "active", "in-progress", "in_progress"] };
        }
        // Fetch raw trips with route + stops populated
        let trips = await Trip_1.default.find(filter)
            .populate({
            path: "route",
            populate: { path: "stops", model: "Stop" },
        })
            .populate("bus")
            .sort({ date: 1 })
            .lean(); // lean() so we can attach extra properties below
        // For each trip, count the bookings that belong to it.
        // Bookings link to route (not trip directly), so we match on:
        //   route  = trip.route._id
        //   date   = same calendar day as trip.date
        //   status = pending | assigned | active (i.e. not cancelled/missed)
        //
        // The timeSlot in Booking is "Morning" | "Return" while Trip uses
        // "morning" | "return_1530" | "return_1900".  We map accordingly.
        const Booking = (await Promise.resolve().then(() => __importStar(require("../models/Booking.model")))).default;
        const slotMap = {
            morning: ["Morning"],
            return_1530: ["Return"],
            return_1900: ["Return"],
        };
        const enrichedTrips = await Promise.all(trips.map(async (trip) => {
            const dayStart = new Date(trip.date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(trip.date);
            dayEnd.setHours(23, 59, 59, 999);
            const matchingSlots = slotMap[trip.time_slot] ?? [];
            const usersCount = await Booking.countDocuments({
                route: trip.route?._id ?? trip.route,
                date: { $gte: dayStart, $lte: dayEnd },
                timeSlot: { $in: matchingSlots },
                status: { $in: ["pending", "assigned", "active"] },
            });
            return {
                ...trip,
                usersCount,
                // scheduled_time is the canonical ISO departure time.
                // The frontend uses this to compute the 15-minute time gate.
                scheduled_time: trip.date instanceof Date
                    ? trip.date.toISOString()
                    : trip.date,
            };
        }));
        res.json({ results: enrichedTrips.length, data: enrichedTrips });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getDriverTrips = getDriverTrips;
// Get Single Trip
const getTripById = async (req, res) => {
    try {
        const trip = await Trip_1.default.findById(req.params.id)
            .populate({ path: "route", populate: { path: "stops", model: "Stop" } })
            .populate("driver", "name email")
            .populate("bus");
        if (!trip)
            return res.status(404).json({ message: "Trip not found" });
        res.json(trip);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getTripById = getTripById;
// Helper to parse composite IDs into a MongoDB query filter
const buildCompositeFilter = (idString) => {
    const parts = idString.split("-");
    // Format: busId-routeId-timeSlot-specificReturnTime
    const routeId = parts[1];
    const timeSlotRaw = parts[2];
    const specificReturnTime = parts.slice(3).join("-");
    let time_slot = "morning";
    if (timeSlotRaw === "Return") {
        time_slot = (specificReturnTime === "19:00" || specificReturnTime === "7:00 PM") ? "return_1900" : "return_1530";
    }
    return { route: new mongoose_1.default.Types.ObjectId(routeId), time_slot: time_slot };
};
// Update Trip (Admin)
const updateTrip = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.driver === "") {
            return res.status(400).json({ message: "Driver ID is strictly required" });
        }
        if (req.body.driver_id) {
            updateData.driver = req.body.driver_id;
        }
        if (updateData.bus_number) {
            const busDoc = await Bus_1.default.findOne({ busCode: updateData.bus_number });
            if (busDoc) {
                updateData.bus = busDoc._id;
            }
        }
        if (req.params.id.includes("-")) {
            const filter = buildCompositeFilter(req.params.id);
            // Attempt to respect date if provided in body
            if (updateData.date || updateData.departure_time) {
                const targetDate = updateData.date || updateData.departure_time;
                const startOfDay = new Date(targetDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(targetDate);
                endOfDay.setHours(23, 59, 59, 999);
                filter.$or = [
                    { date: { $gte: startOfDay, $lte: endOfDay } },
                    { departure_time: { $gte: startOfDay, $lte: endOfDay } }
                ];
            }
            await Trip_1.default.updateMany(filter, updateData, { runValidators: true });
            return res.json({ message: "Grouped trips updated successfully." });
        }
        // =========================================================================
        // RESOURCE CONFLICT VALIDATION (Single Trip)
        // =========================================================================
        const existingTrip = await Trip_1.default.findById(req.params.id);
        if (!existingTrip)
            return res.status(404).json({ message: "Trip not found" });
        const targetDate = updateData.date || updateData.departure_time || existingTrip.date || existingTrip.departure_time;
        const targetTimeSlot = updateData.time_slot || existingTrip.time_slot;
        const requestedDriver = updateData.driver || existingTrip.driver;
        const requestedBus = updateData.bus_number || existingTrip.bus_number;
        if (requestedDriver && requestedBus && targetDate && targetTimeSlot) {
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            const conflictQuery = {
                _id: { $ne: req.params.id },
                time_slot: targetTimeSlot,
                status: { $ne: "cancelled" },
                $and: [
                    {
                        $or: [
                            { date: { $gte: startOfDay, $lte: endOfDay } },
                            { departure_time: { $gte: startOfDay, $lte: endOfDay } }
                        ]
                    },
                    {
                        $or: [
                            { driver: requestedDriver },
                            { bus_number: requestedBus }
                        ]
                    }
                ]
            };
            const conflict = await Trip_1.default.findOne(conflictQuery);
            if (conflict) {
                return res.status(409).json({
                    message: "Conflict: This Bus or Driver is already assigned to another route on this date and time slot."
                });
            }
        }
        // =========================================================================
        const trip = await Trip_1.default.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after', runValidators: true }).populate("driver", "name email");
        if (!trip)
            return res.status(404).json({ message: "Trip not found" });
        res.json(trip);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateTrip = updateTrip;
// Bulk Delete Trips (Admin)
const bulkDeleteTrips = async (req, res) => {
    try {
        const { tripIds } = req.body;
        if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
            return res.status(400).json({ message: "No IDs provided" });
        }
        const Booking = (await Promise.resolve().then(() => __importStar(require("../models/Booking.model")))).default;
        for (const id of tripIds) {
            if (mongoose_1.default.Types.ObjectId.isValid(id)) {
                const trip = await Trip_1.default.findById(id);
                if (trip) {
                    const dayStart = new Date(trip.date);
                    dayStart.setUTCHours(0, 0, 0, 0);
                    const dayEnd = new Date(trip.date);
                    dayEnd.setUTCHours(23, 59, 59, 999);
                    const bookingTimeSlot = trip.time_slot.includes("return") ? "Return" : "Morning";
                    const query = {
                        route: trip.route,
                        timeSlot: bookingTimeSlot,
                        date: { $gte: dayStart, $lte: dayEnd },
                        status: "assigned"
                    };
                    if (trip.time_slot === "return_1900")
                        query.specificReturnTime = { $in: ["19:00", "7:00 PM"] };
                    if (trip.time_slot === "return_1530")
                        query.specificReturnTime = { $in: ["15:30", "3:30 PM", "15:00", "3:00 PM"] };
                    await Booking.updateMany(query, { $set: { status: "pending" }, $unset: { busId: "" } });
                    await Trip_1.default.findByIdAndDelete(id);
                }
            }
            else if (typeof id === "string" && id.includes("-")) {
                // Fallback: Trip document doesn't exist, revert Bookings using the composite string
                const parts = id.split("-");
                const busId = parts[0];
                const routeId = parts[1];
                const timeSlot = parts[2];
                const specificReturnTime = parts.slice(3).join("-");
                const query = {
                    status: "assigned",
                    busId: busId === "unknown-bus" || busId === "none" ? { $exists: false } : busId,
                    route: routeId,
                    timeSlot: timeSlot
                };
                if (specificReturnTime && specificReturnTime !== "none") {
                    query.specificReturnTime = specificReturnTime;
                }
                await Booking.updateMany(query, { $set: { status: "pending" }, $unset: { busId: "" } });
            }
        }
        return res.json({ message: "Trips deleted and bookings unassigned successfully" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.bulkDeleteTrips = bulkDeleteTrips;
// Delete Trip (Admin)
const deleteTrip = async (req, res) => {
    try {
        if (req.params.id.includes(",")) {
            const idArray = req.params.id
                .split(",")
                .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id.trim()))
                .map((id) => new mongoose_1.default.Types.ObjectId(id.trim()));
            if (idArray.length > 0) {
                await Trip_1.default.deleteMany({ _id: { $in: idArray } });
                return res.json({ message: "Grouped trips deleted successfully" });
            }
        }
        // Fallback for single standard ID deletion
        if (mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            const trip = await Trip_1.default.findByIdAndDelete(req.params.id);
            if (!trip)
                return res.status(404).json({ message: "Trip not found" });
            return res.json({ message: "Trip deleted successfully" });
        }
        return res.status(400).json({ message: "Invalid ID format provided" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.deleteTrip = deleteTrip;
// Start Trip — called by driver OR admin
const startTrip = async (req, res) => {
    try {
        const trip = await Trip_1.default.findById(req.params.id);
        if (!trip)
            return res.status(404).json({ message: "Trip not found" });
        trip.status = "in-progress";
        trip.start_time = new Date();
        await trip.save();
        // Notify all clients in the trip room that the trip is now active
        try {
            const io = (0, socket_1.getIO)();
            io.to(`trip:${trip._id}`).emit("trip_status_update", { tripId: trip._id, status: "in-progress" });
            io.to("admin_tracking").emit("trip_status_update", { tripId: trip._id, status: "in-progress" });
            // CRITICAL: emit a Socket.io event trip_started with the routeId so the students' apps know the bus is moving and tracking has begun
            const routeId = trip.route.toString();
            io.emit("trip_started", { routeId });
            io.to(`route:${routeId}`).emit("trip_started", { routeId });
            io.to(`trip:${trip._id}`).emit("trip_started", { routeId });
        }
        catch (_) { /* socket may not be init in tests */ }
        res.json({ message: "Trip started", trip });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.startTrip = startTrip;
// Update Live Location (HTTP fallback)
const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const trip = await Trip_1.default.findById(req.params.id);
        if (!trip)
            return res.status(404).json({ message: "Trip not found" });
        trip.current_location = { lat, lng, last_updated: new Date() };
        await trip.save();
        res.json({ message: "Location updated", trip });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateLocation = updateLocation;
// End Trip — called by driver OR admin
const endTrip = async (req, res) => {
    try {
        const trip = await Trip_1.default.findById(req.params.id);
        if (!trip)
            return res.status(404).json({ message: "Trip not found" });
        trip.status = "completed";
        await trip.save();
        // Notify all clients the trip ended
        try {
            const io = (0, socket_1.getIO)();
            io.to(`trip:${trip._id}`).emit("trip_status_update", { tripId: trip._id, status: "completed" });
            io.to("admin_tracking").emit("trip_status_update", { tripId: trip._id, status: "completed" });
        }
        catch (_) { /* socket may not be init in tests */ }
        res.json({ message: "Trip ended", trip });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.endTrip = endTrip;
// Get Monthly Quota Information
const getMonthlyQuota = async (req, res) => {
    try {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const monthYear = `${month}-${year}`;
        // 1. Define start and end of current month
        const startDate = new Date(year, today.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(year, today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        const queryFilter = {
            departure_time: { $gte: startDate, $lte: endDate },
            bus_number: { $exists: true, $nin: [null, ""] },
            status: { $ne: 'cancelled' }
        };
        // 2. Dynamic Count: Count trips that have actively consumed a bus
        const calculatedCount = await Trip_1.default.countDocuments(queryFilter);
        // 3. Auto-correct the Quota Ledger
        const quota = await quotaModel_1.default.findOneAndUpdate({ monthYear }, {
            $set: { usedCapacity: calculatedCount },
            $setOnInsert: { totalCapacity: 308 }
        }, { returnDocument: 'after', upsert: true });
        console.log("--- QUOTA DEBUG ---");
        console.log("Start Date:", startDate, "| End Date:", endDate);
        console.log("Executed Query Filter:", JSON.stringify(queryFilter));
        console.log("Calculated Assigned Buses:", calculatedCount);
        console.log("-------------------");
        return res.status(200).json({
            usedCapacity: calculatedCount,
            totalCapacity: quota?.totalCapacity || 308
        });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
exports.getMonthlyQuota = getMonthlyQuota;
