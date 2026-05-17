"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegistrationWindowTool = exports.bookTripTool = exports.getAvailableTripsTool = exports.getBookingStatusTool = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_model_1 = __importDefault(require("../../models/Booking.model"));
const Route_1 = __importDefault(require("../../models/Route"));
const User_1 = __importDefault(require("../../models/User"));
const Settings_model_1 = __importDefault(require("../../models/Settings.model"));
// ─── Helper ────────────────────────────────────────────────────────────────────
/** Returns true only if the string is a valid 24-hex MongoDB ObjectId. */
function isValidObjectId(id) {
    return mongoose_1.default.Types.ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(id);
}
/**
 * getBookingStatusTool
 * --------------------
 * Retrieves a student's bookings from MongoDB.
 * Every code path returns a string so the LangChain message history stays valid.
 */
exports.getBookingStatusTool = (0, tools_1.tool)(async ({ userId, date }) => {
    const args = { userId, date };
    console.log(`[Tool Called]: getBookingStatus with args:`, args);
    try {
        // ── Guard: validate userId is a real ObjectId ──────────────────────────
        if (!isValidObjectId(userId)) {
            return JSON.stringify({
                error: `Invalid userId "${userId}". Must be a 24-character MongoDB ObjectId.`,
            });
        }
        // ── Guard: validate date format if supplied ────────────────────────────
        if (date) {
            const parsed = new Date(date);
            if (isNaN(parsed.getTime())) {
                return JSON.stringify({
                    error: `Invalid date format "${date}". Please use YYYY-MM-DD.`,
                });
            }
        }
        // ── Verify user exists ─────────────────────────────────────────────────
        const user = await User_1.default.findById(userId).select("name email student_id role");
        if (!user) {
            return JSON.stringify({ error: "User not found." });
        }
        // ── Build date filter ──────────────────────────────────────────────────
        let dateFilter = {};
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            dateFilter = { createdAt: { $gte: start, $lte: end } };
        }
        // ── Fetch bookings with populated route details ─────────────────────────
        const bookings = await Booking_model_1.default.find({ user: userId, ...dateFilter })
            .populate("route", "name")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        if (!bookings.length) {
            return JSON.stringify({
                student: { name: user.name, student_id: user.student_id ?? "N/A" },
                message: date ? `No bookings found for ${date}.` : "No bookings found.",
                bookings: [],
            });
        }
        // ── Map to a clean shape for the AI to read ────────────────────────────
        const formatted = bookings.map((b) => ({
            bookingId: b._id.toString(),
            status: b.status,
            attended: b.attended,
            route: b.route?.name ?? "N/A",
            date: b.date ? new Date(b.date).toLocaleDateString("en-EG") : "N/A",
            timeSlot: b.timeSlot,
            bookedAt: new Date(b.createdAt).toLocaleString("en-EG"),
        }));
        return JSON.stringify({
            student: { name: user.name, student_id: user.student_id ?? "N/A" },
            totalBookings: formatted.length,
            bookings: formatted,
        });
    }
    catch (err) {
        console.error("[getBookingStatus tool error]", err.message);
        return JSON.stringify({ error: `Tool failed: ${err.message}. Do not retry.` });
    }
}, {
    name: "getBookingStatus",
    description: "Fetches the student's current and past bus bookings from the database. " +
        "Use this whenever a student asks about their booking status, trip details, or attendance record. " +
        "Always pass the authenticated userId. Optionally pass a date (YYYY-MM-DD) to filter results.",
    schema: zod_1.z.object({
        userId: zod_1.z
            .string()
            .describe("The MongoDB ObjectId string of the authenticated student."),
        date: zod_1.z
            .string()
            .optional()
            .describe("Optional date filter in YYYY-MM-DD format. If omitted, returns the 10 most recent bookings."),
    }),
});
/**
 * getAvailableTripsTool
 * ----------------------
 * Fetches active trips/time-slots from MongoDB for a given date.
 * Defaults to tomorrow (Cairo time) when no date is supplied.
 * Every code path returns a string so the LangChain message history stays valid.
 */
exports.getAvailableTripsTool = (0, tools_1.tool)(async ({ date }) => {
    const args = { date };
    console.log(`[Tool Called]: getAvailableTrips with args:`, args);
    try {
        // ── Resolve target date ────────────────────────────────────────────────
        let targetDate;
        if (date) {
            if (date.toLowerCase() === 'today') {
                const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
                targetDate = new Date(cairoNow.getFullYear(), cairoNow.getMonth(), cairoNow.getDate());
            }
            else if (date.toLowerCase() === 'tomorrow') {
                const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
                cairoNow.setDate(cairoNow.getDate() + 1);
                targetDate = new Date(cairoNow.getFullYear(), cairoNow.getMonth(), cairoNow.getDate());
            }
            else {
                // parse YYYY-MM-DD locally to avoid UTC timezone shifts
                const parts = date.split("-").map(Number);
                if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                    targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
                }
                else {
                    return JSON.stringify({ error: `Invalid date format "${date}". Please use YYYY-MM-DD.` });
                }
            }
        }
        else {
            // Default: tomorrow in Cairo time
            const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
            cairoNow.setDate(cairoNow.getDate() + 1);
            targetDate = new Date(cairoNow.getFullYear(), cairoNow.getMonth(), cairoNow.getDate());
        }
        const startOfTomorrow = new Date(targetDate);
        startOfTomorrow.setHours(0, 0, 0, 0);
        const endOfTomorrow = new Date(targetDate);
        endOfTomorrow.setHours(23, 59, 59, 999);
        // ── Query active routes ─────────────────────────────────────────────────
        const routes = await Route_1.default.find()
            .select("name distance duration")
            .lean();
        if (!routes.length) {
            return JSON.stringify({
                message: "No routes are available at the moment.",
                routes: [],
            });
        }
        const formatted = routes.map((r) => ({
            routeId: r._id.toString(),
            name: r.name,
            distance: r.distance || "N/A",
            duration: r.duration || "N/A",
        }));
        return JSON.stringify({
            totalRoutes: formatted.length,
            routes: formatted,
        });
    }
    catch (err) {
        console.error("[getAvailableRoutes tool error]", err.message);
        return JSON.stringify({ error: `Tool failed: ${err.message}. Do not retry.` });
    }
}, {
    name: "getAvailableTrips",
    description: "Fetches the list of active routes available. You can use this to answer questions about available routes. Do NOT call this before bookTrip unless asked.",
    schema: zod_1.z.object({
        date: zod_1.z
            .string()
            .optional()
            .describe("Optional date in YYYY-MM-DD format. Defaults to tomorrow (Cairo time) if omitted."),
    }),
});
/**
 * bookTripTool
 * ------------
 * Books a trip for an authenticated student.
 * Accepts date + timeSlot — resolves the trip internally so the AI does NOT
 * need to call getAvailableTrips first. Eliminates the two-tool chain that
 * caused recursion loops.
 * Every code path returns a string so the LangChain message history stays valid.
 */
exports.bookTripTool = (0, tools_1.tool)(async ({ userId, date, timeSlot, routeName, }) => {
    const args = { userId, date, timeSlot, routeName };
    console.log(`[Tool Called]: bookTrip with args:`, args);
    try {
        // ── Guard: validate userId ─────────────────────────────────────────────
        if (!isValidObjectId(userId)) {
            return JSON.stringify({
                error: `Invalid userId "${userId}". Must be a 24-character MongoDB ObjectId.`,
            });
        }
        // ── Guard: validate date format ────────────────────────────────────────
        let parsedDate;
        if (date.toLowerCase() === 'today') {
            const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
            parsedDate = new Date(cairoNow.getFullYear(), cairoNow.getMonth(), cairoNow.getDate());
        }
        else if (date.toLowerCase() === 'tomorrow') {
            const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
            cairoNow.setDate(cairoNow.getDate() + 1);
            parsedDate = new Date(cairoNow.getFullYear(), cairoNow.getMonth(), cairoNow.getDate());
        }
        else {
            const parts = date.split("-").map(Number);
            if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
            }
            else {
                return JSON.stringify({ error: `Invalid date "${date}". Please use YYYY-MM-DD format.` });
            }
        }
        // ── 1. Verify user exists ──────────────────────────────────────────────
        const user = await User_1.default.findById(userId).select("name student_id");
        if (!user) {
            return JSON.stringify({ error: "Student account not found. Booking cancelled." });
        }
        // ── 2. Check if student already has a booking for this date ─────────
        const existingBooking = await Booking_model_1.default.findOne({
            user: userId,
            date: parsedDate,
            timeSlot: timeSlot,
            status: { $ne: "cancelled" }
        });
        if (existingBooking) {
            return "Booking failed: You already have a booking for this time slot on this date.";
        }
        // ── 3. Resolve route by name (case-insensitive) ─────────────────
        const route = await Route_1.default.findOne({
            name: { $regex: new RegExp(`^${routeName}$`, "i") },
        });
        if (!route) {
            return JSON.stringify({
                error: `Route "${routeName}" was not found in the system. Please provide a valid route name and try again.`,
            });
        }
        // ── 4. Create booking demand record ──────────────────────────────────────────
        const newBooking = await Booking_model_1.default.create({
            user: userId,
            route: route._id,
            date: parsedDate,
            timeSlot: timeSlot,
            status: "pending",
            attended: false,
        });
        return "Booking demand successfully saved! " + JSON.stringify({
            student: `${user.name} (ID: ${user.student_id ?? "N/A"})`,
            route: route.name,
            date: parsedDate.toLocaleDateString("en-EG"),
            timeSlot: timeSlot,
            bookingId: newBooking._id.toString(),
            status: "pending",
        });
    }
    catch (err) {
        console.error("[bookTrip tool error]", err.message);
        return JSON.stringify({ error: `Tool failed: ${err.message}. Do not retry.` });
    }
}, {
    name: "bookTrip",
    description: "Books a route demand for the authenticated student. " +
        "Use this tool ONLY when the student explicitly asks to book or reserve a route. " +
        "Pass: date (YYYY-MM-DD), timeSlot ('Morning', 'Return'), and routeName. ",
    schema: zod_1.z.object({
        userId: zod_1.z
            .string()
            .describe("The MongoDB ObjectId string of the authenticated student."),
        date: zod_1.z
            .string()
            .describe("The date of the trip in YYYY-MM-DD format. " +
            "Calculate it yourself from 'today'/'tomorrow' using the current Cairo date — never ask the user."),
        timeSlot: zod_1.z
            .string()
            .describe("The time slot to book. Must be exactly one of: 'Morning', 'Return'."),
        routeName: zod_1.z
            .string()
            .describe("The name of the route the student wants to book (e.g. 'Stadium')."),
    }),
});
/**
 * getRegistrationWindowTool
 * -------------------------
 * Fetches the dynamic registration opening and closing times from the Settings model
 * and PROGRAMMATICALLY compares them against the exact current Africa/Cairo time.
 */
exports.getRegistrationWindowTool = (0, tools_1.tool)(async () => {
    console.log(`[Tool Called]: getRegistrationWindow`);
    try {
        const settings = await Settings_model_1.default.findOne();
        const openH = settings ? settings.booking_open_hour : 0;
        const openM = settings ? settings.booking_open_minute : 0;
        const closeH = settings ? settings.booking_close_hour : 14;
        const closeM = settings ? settings.booking_close_minute : 0;
        // Format strings for presentation
        const formatTime = (h, m) => {
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hr = h % 12 || 12;
            return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
        };
        const startTimeStr = formatTime(openH, openM);
        const endTimeStr = formatTime(closeH, closeM);
        // Get exact current time in Cairo
        const cairoNowString = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });
        const cairoNow = new Date(cairoNowString);
        const currentH = cairoNow.getHours();
        const currentM = cairoNow.getMinutes();
        // Calculate minutes since midnight for easy comparison
        const currentMinutes = currentH * 60 + currentM;
        const startMinutes = openH * 60 + openM;
        const endMinutes = closeH * 60 + closeM;
        const isOpen = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        return JSON.stringify({
            startTime: startTimeStr,
            endTime: endTimeStr,
            currentTime: formatTime(currentH, currentM),
            isOpen: isOpen,
            message: isOpen
                ? `The window is currently OPEN. Registration closes at ${endTimeStr}.`
                : `The window is currently CLOSED. Registration is only open between ${startTimeStr} and ${endTimeStr}.`
        });
    }
    catch (err) {
        console.error("[getRegistrationWindow tool error]", err.message);
        return JSON.stringify({ error: `Tool failed: ${err.message}. Do not retry.` });
    }
}, {
    name: "getRegistrationWindow",
    description: "Fetches the dynamic registration opening and closing times and definitively tells you if the window is currently OPEN or CLOSED. " +
        "You MUST ALWAYS call this tool before assisting with a new booking and strictly obey the isOpen flag it returns.",
    schema: zod_1.z.object({}),
});
