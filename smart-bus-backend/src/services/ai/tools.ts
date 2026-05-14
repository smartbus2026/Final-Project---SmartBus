import { tool } from "@langchain/core/tools";
import { z } from "zod";
import mongoose from "mongoose";
import Booking from "../../models/Booking.model";
import Trip from "../../models/Trip";
import User from "../../models/User";
import Stop from "../../models/stop";
import Settings from "../../models/Settings.model";

// ─── Helper ────────────────────────────────────────────────────────────────────
/** Returns true only if the string is a valid 24-hex MongoDB ObjectId. */
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(id);
}

/**
 * getBookingStatusTool
 * --------------------
 * Retrieves a student's bookings from MongoDB.
 * Every code path returns a string so the LangChain message history stays valid.
 */
export const getBookingStatusTool = tool(
  async ({ userId, date }: { userId: string; date?: string }) => {
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
      const user = await User.findById(userId).select("name email student_id role");
      if (!user) {
        return JSON.stringify({ error: "User not found." });
      }

      // ── Build date filter ──────────────────────────────────────────────────
      let dateFilter: Record<string, unknown> = {};
      if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: start, $lte: end } };
      }

      // ── Fetch bookings with populated trip details ─────────────────────────
      const bookings = await Booking.find({ user: userId, ...dateFilter })
        .populate({
          path: "trip",
          select: "date time_slot bus_number status booked_seats total_seats",
          model: Trip,
        })
        .populate("pickup_point", "name")
        .select("seat_number status attended createdAt trip pickup_point")
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
      const formatted = bookings.map((b: any) => ({
        bookingId: b._id.toString(),
        status: b.status,
        attended: b.attended,
        seatNumber: b.seat_number,
        pickupPoint: b.pickup_point?.name ?? "N/A",
        trip: b.trip
          ? {
              date: b.trip.date
                ? new Date(b.trip.date).toLocaleDateString("en-EG")
                : "N/A",
              timeSlot: b.trip.time_slot,
              busNumber: b.trip.bus_number,
              tripStatus: b.trip.status,
              availableSeats: b.trip.total_seats - b.trip.booked_seats,
            }
          : null,
        bookedAt: new Date(b.createdAt).toLocaleString("en-EG"),
      }));

      return JSON.stringify({
        student: { name: user.name, student_id: user.student_id ?? "N/A" },
        totalBookings: formatted.length,
        bookings: formatted,
      });
    } catch (err: any) {
      console.error("[getBookingStatus tool error]", err.message);
      return JSON.stringify({ error: `Tool failed: ${err.message}. Do not retry.` });
    }
  },
  {
    name: "getBookingStatus",
    description:
      "Fetches the student's current and past bus bookings from the database. " +
      "Use this whenever a student asks about their booking status, trip details, or attendance record. " +
      "Always pass the authenticated userId. Optionally pass a date (YYYY-MM-DD) to filter results.",
    schema: z.object({
      userId: z
        .string()
        .describe("The MongoDB ObjectId string of the authenticated student."),
      date: z
        .string()
        .optional()
        .describe(
          "Optional date filter in YYYY-MM-DD format. If omitted, returns the 10 most recent bookings."
        ),
    }),
  }
);

/**
 * getAvailableTripsTool
 * ----------------------
 * Fetches active trips/time-slots from MongoDB for a given date.
 * Defaults to tomorrow (Cairo time) when no date is supplied.
 * Every code path returns a string so the LangChain message history stays valid.
 */
export const getAvailableTripsTool = tool(
  async ({ date }: { date?: string }) => {
    const args = { date };
    console.log(`[Tool Called]: getAvailableTrips with args:`, args);

    try {
      // ── Resolve target date ────────────────────────────────────────────────
      let targetDate: Date;
      if (date) {
        targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
          return JSON.stringify({
            error: `Invalid date format "${date}". Please use YYYY-MM-DD.`,
          });
        }
      } else {
        // Default: tomorrow in Cairo time
        const cairoNow = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" })
        );
        cairoNow.setDate(cairoNow.getDate() + 1);
        targetDate = cairoNow;
      }

      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);

      // ── Query active trips ─────────────────────────────────────────────────
      const trips = await Trip.find({
        date: { $gte: start, $lte: end },
        status: "active",
      })
        .populate("route", "name")
        .select("date time_slot bus_number total_seats booked_seats status route")
        .sort({ time_slot: 1 })
        .lean();

      const dateLabel = start.toLocaleDateString("en-EG");

      if (!trips.length) {
        return JSON.stringify({
          date: dateLabel,
          message: "No active trips are scheduled for this date.",
          trips: [],
        });
      }

      const formatted = trips.map((t: any) => ({
        tripId: t._id.toString(),
        date: new Date(t.date).toLocaleDateString("en-EG"),
        timeSlot: t.time_slot,
        routeName: t.route?.name ?? "N/A",
        busNumber: t.bus_number,
        availableSeats: t.total_seats - t.booked_seats,
        totalSeats: t.total_seats,
        status: t.status,
      }));

      return JSON.stringify({
        date: dateLabel,
        totalActiveTrips: formatted.length,
        trips: formatted,
      });
    } catch (err: any) {
      console.error("[getAvailableTrips tool error]", err.message);
      return JSON.stringify({ error: `Tool failed: ${err.message}. Do not retry.` });
    }
  },
  {
    name: "getAvailableTrips",
    description:
      "Fetches the list of active trips (time slots) available for a specific date from the database. " +
      "Defaults to tomorrow (Cairo time) if no date is provided. " +
      "Use this to answer questions about available trips or schedules. " +
      "Do NOT call this before bookTrip — bookTrip resolves the trip internally.",
    schema: z.object({
      date: z
        .string()
        .optional()
        .describe(
          "Optional date in YYYY-MM-DD format. Defaults to tomorrow (Cairo time) if omitted."
        ),
    }),
  }
);

/**
 * bookTripTool
 * ------------
 * Books a trip for an authenticated student.
 * Accepts date + timeSlot — resolves the trip internally so the AI does NOT
 * need to call getAvailableTrips first. Eliminates the two-tool chain that
 * caused recursion loops.
 * Every code path returns a string so the LangChain message history stays valid.
 */
export const bookTripTool = tool(
  async ({
    userId,
    date,
    timeSlot,
    pickupPointName,
  }: {
    userId: string;
    date: string;
    timeSlot: string;
    pickupPointName: string;
  }) => {
    const args = { userId, date, timeSlot, pickupPointName };
    console.log(`[Tool Called]: bookTrip with args:`, args);

    try {
      // ── Guard: validate userId ─────────────────────────────────────────────
      if (!isValidObjectId(userId)) {
        return JSON.stringify({
          error: `Invalid userId "${userId}". Must be a 24-character MongoDB ObjectId.`,
        });
      }

      // ── Guard: validate date format ────────────────────────────────────────
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return JSON.stringify({
          error: `Invalid date "${date}". Please use YYYY-MM-DD format.`,
        });
      }

      const dayStart = new Date(parsedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(parsedDate);
      dayEnd.setHours(23, 59, 59, 999);

      // ── 1. Verify user exists ──────────────────────────────────────────────
      const user = await User.findById(userId).select("name student_id");
      if (!user) {
        return JSON.stringify({ error: "Student account not found. Booking cancelled." });
      }

      // ── 2. Look up the active trip by date + timeSlot (no tripId needed) ──
      const trip = await Trip.findOne({
        date: { $gte: dayStart, $lte: dayEnd },
        time_slot: timeSlot,
        status: "active",
      });

      if (!trip) {
        return "Booking failed: No active trip found for this date and time. Please check available trips.";
      }

      // ── 3. Check seat availability ────────────────────────────────────────
      const availableSeats = trip.total_seats - trip.booked_seats;
      if (availableSeats <= 0) {
        return JSON.stringify({
          error: `No seats available on the ${timeSlot} trip for ${date}. Please choose a different trip.`,
        });
      }

      // ── 4. Check if student already has ANY booking for this date ─────────
      // Covers one-return-per-day rule and duplicate prevention in one query.
      // No status filter — any prior booking on this day blocks a new one.
      const allTripsOnDay = await Trip.find({
        date: { $gte: dayStart, $lte: dayEnd },
      }).select("_id");

      const allTripIds = allTripsOnDay.map((t) => t._id);

      const existingBooking = await Booking.findOne({
        user: userId,
        trip: { $in: allTripIds },
      });

      if (existingBooking) {
        return "Booking failed: You already have a booking for this date.";
      }

      // ── 5. Resolve pickup stop by name (case-insensitive) ─────────────────
      const stop = await Stop.findOne({
        name: { $regex: new RegExp(`^${pickupPointName}$`, "i") },
      });
      if (!stop) {
        return JSON.stringify({
          error: `Pickup point "${pickupPointName}" was not found in the system. Please provide a valid stop name and try again.`,
        });
      }

      // ── 6. Auto-assign next seat number ───────────────────────────────────
      const nextSeat = trip.booked_seats + 1;

      // ── 7. Create booking record ──────────────────────────────────────────
      const newBooking = await Booking.create({
        user: userId,
        trip: trip._id,
        pickup_point: stop._id,
        seat_number: nextSeat,
        status: "active",
        attended: false,
      });

      // ── 8. Increment booked_seats on the trip atomically ──────────────────
      await Trip.findByIdAndUpdate(trip._id, { $inc: { booked_seats: 1 } });

      return "Booking successful! " + JSON.stringify({
        student: `${user.name} (ID: ${user.student_id ?? "N/A"})`,
        trip: `${trip.time_slot} on ${new Date(trip.date).toLocaleDateString("en-EG")}`,
        pickup: stop.name,
        seat: nextSeat,
        bookingId: newBooking._id.toString(),
        status: "active",
      });
    } catch (err: any) {
      console.error("[bookTrip tool error]", err.message);
      return JSON.stringify({ error: `Tool failed: ${err.message}. Do not retry.` });
    }
  },
  {
    name: "bookTrip",
    description:
      "Books a bus trip for the authenticated student. " +
      "Use this tool ONLY when the student explicitly asks to book or reserve a trip. " +
      "Pass: date (YYYY-MM-DD), timeSlot ('morning', 'return_1530', or 'return_1900'), and pickupPointName. " +
      "The tool looks up the trip internally — do NOT call getAvailableTrips before this. " +
      "Enforces seat availability and one-booking-per-day automatically.",
    schema: z.object({
      userId: z
        .string()
        .describe("The MongoDB ObjectId string of the authenticated student."),
      date: z
        .string()
        .describe(
          "The date of the trip in YYYY-MM-DD format. " +
          "Calculate it yourself from 'today'/'tomorrow' using the current Cairo date — never ask the user."
        ),
      timeSlot: z
        .string()
        .describe(
          "The time slot to book. Must be exactly one of: 'morning', 'return_1530', 'return_1900'. " +
          "Map user phrases: morning/before noon → 'morning'; 1:30 PM/afternoon → 'return_1530'; 7 PM/evening → 'return_1900'."
        ),
      pickupPointName: z
        .string()
        .describe("The name of the student's pickup stop (e.g. 'Cairo University Gate')."),
    }),
  }
);

/**
 * getRegistrationWindowTool
 * -------------------------
 * Fetches the dynamic registration opening and closing times from the Settings model.
 */
export const getRegistrationWindowTool = tool(
  async () => {
    console.log(`[Tool Called]: getRegistrationWindow`);

    try {
      const settings = await Settings.findOne();
      if (!settings) {
        return JSON.stringify({
          booking_open_hour: 0,
          booking_open_minute: 0,
          booking_close_hour: 14,
          booking_close_minute: 0,
          message: "Settings not found, using default 12:00 AM to 2:00 PM."
        });
      }

      return JSON.stringify({
        booking_open_hour: settings.booking_open_hour,
        booking_open_minute: settings.booking_open_minute,
        booking_close_hour: settings.booking_close_hour,
        booking_close_minute: settings.booking_close_minute,
      });
    } catch (err: any) {
      console.error("[getRegistrationWindow tool error]", err.message);
      return JSON.stringify({ error: `Tool failed: ${err.message}. Do not retry.` });
    }
  },
  {
    name: "getRegistrationWindow",
    description:
      "Fetches the current dynamic registration opening and closing times set by the Admin. " +
      "You MUST ALWAYS call this tool to check the allowed start and end times before assisting " +
      "a user with a booking or answering questions about deadlines.",
    schema: z.object({}),
  }
);

