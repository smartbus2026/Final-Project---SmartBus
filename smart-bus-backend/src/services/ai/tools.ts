import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Booking from "../../models/Booking.model";
import Trip from "../../models/Trip";
import User from "../../models/User";

/**
 * getBookingStatus
 * ----------------
 * A LangChain tool that retrieves a student's bookings from MongoDB.
 * The AI agent calls this whenever a user asks about their booking status.
 *
 * Accepts userId (MongoDB ObjectId string) and an optional date filter.
 */
export const getBookingStatusTool = tool(
  async ({ userId, date }: { userId: string; date?: string }) => {
    try {
      // Verify user exists
      const user = await User.findById(userId).select("name email student_id role");
      if (!user) {
        return JSON.stringify({ error: "User not found." });
      }

      // Build date filter
      let dateFilter: Record<string, unknown> = {};
      if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: start, $lte: end } };
      }

      // Fetch bookings, populate trip details
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
          message: date
            ? `No bookings found for ${date}.`
            : "No bookings found.",
          bookings: [],
        });
      }

      // Map to a clean shape for the AI to read
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
      return JSON.stringify({ error: "Failed to fetch booking data. Please try again." });
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
 * A LangChain tool that fetches active trips/time-slots from MongoDB for a
 * given date (defaults to tomorrow in Cairo time when no date is supplied).
 *
 * The AI agent should call this whenever a student asks which trips or return
 * slots are available — ensuring the response always reflects the Admin's
 * latest schedule rather than any hard-coded times.
 */
export const getAvailableTripsTool = tool(
  async ({ date }: { date?: string }) => {
    try {
      // Default to tomorrow (Cairo time) when no date is provided
      let targetDate: Date;
      if (date) {
        targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
          return JSON.stringify({ error: `Invalid date format: "${date}". Please use YYYY-MM-DD.` });
        }
      } else {
        // Get current Cairo time and advance by one day
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
      return JSON.stringify({ error: "Failed to fetch available trips. Please try again." });
    }
  },
  {
    name: "getAvailableTrips",
    description:
      "Fetches the list of active trips (time slots) available for a specific date from the database. " +
      "Defaults to tomorrow (Cairo time) if no date is provided. " +
      "ALWAYS call this tool before answering any question about available trips, return slots, or schedule times. " +
      "Never assume or hard-code time slots — the Admin controls the schedule dynamically.",
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
