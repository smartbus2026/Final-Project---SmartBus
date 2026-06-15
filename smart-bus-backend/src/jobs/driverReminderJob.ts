import mongoose from 'mongoose';
import Trip from "../models/Trip";
import Notification from "../models/notification"; // generic notification model
import Settings from "../models/Settings.model";
import { getIO } from "../socket";
import cron from 'node-cron';

/**
 * Helper to calculate the exact start Date of a trip for today.
 * It mirrors the logic from utils/tripTimeParser.ts but is kept inline
 * to avoid circular imports.
 */
function computeTripStartDate(trip: any, settings: any): Date {
  const today = new Date();
  const dateOnly = new Date(today);
  dateOnly.setHours(0, 0, 0, 0);

  // Resolve time string based on slot
  let timeStr: string | undefined;
  if (trip.time_slot === "morning") {
    timeStr = settings?.morningStartTime ?? "08:30 AM";
  } else if (trip.time_slot.startsWith("return")) {
    // Prefer explicit specificReturnTime, otherwise fallback to a default list
    timeStr = trip.specificReturnTime ?? (settings?.returnTimeOptions?.[0] ?? "03:30 PM");
  }

  if (!timeStr) return dateOnly; // fallback to midnight if unknown

  // Parse "hh:mm AM/PM" format
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return dateOnly;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const start = new Date(dateOnly);
  start.setHours(hour, minute, 0, 0);
  return start;
}

/**
 * Cron job that runs every 5 minutes to:
 *   1️⃣ Send a 1‑hour reminder to drivers (if within 50‑60 min before start).
 *   2️⃣ Send a late‑start alert to drivers and admins (if current time >= start and trip not started).
 */
export const startDriverReminderJob = () => {
  // */5 * * * *  -> every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();

      // Load system settings (morning start time, return options, etc.)
      const settings = await Settings.findOne() || { morningStartTime: '07:30 AM', defaultReturnTime: '15:30' };

      // Determine today (date part only)
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      // Grab trips for today that are still pending (assigned or scheduled)
      const trips = await Trip.find({
        date: { $gte: startOfDay, $lt: endOfDay },
        status: { $in: ["assigned", "scheduled"] },
      })
        .populate("driver")
        .populate("route")
        .exec();

      for (const trip of trips) {
        const t = trip as any; // loose typing for populated fields and status
        const startDate = computeTripStartDate(trip, settings);
        const diffMs = startDate.getTime() - now.getTime();
        const diffMins = diffMs / 60000;

        // ---------- 1‑hour reminder (50‑60 min before) ----------
        if (!t.driverReminderSent && diffMins >= 50 && diffMins <= 60) {
          const driverRoom = `driver_${t.driver._id}`;
          const io = getIO();
          io.to(driverRoom).emit("driver_reminder", {
            message: `Your trip for ${t.route.name} starts in 1 hour. Please get ready.`,
            tripId: trip._id,
          });

          // Persist notification (using the generic Notification model)
          await Notification.create({
            user: t.driver._id,
            title: "Trip Reminder",
            message: `Your trip for ${t.route.name} starts in 1 hour.`,
            type: "driver_reminder",
            read: false,
          });

          // Mark flag
          t.driverReminderSent = true;
          await t.save();
        }

        // ---------- Late‑start alert (now >= start time) ----------
        if (!t.lateAlertSent && diffMins <= 0 && t.status === "assigned") {
          const driverRoom = `driver_${t.driver._id}`;
          const io = getIO();

          // Driver urgent alert
          io.to(driverRoom).emit("driver_late_alert", {
            message: "Trip time has arrived. Please start the trip immediately!",
            tripId: trip._id,
          });

          // Admin alert – assuming there is a dedicated admin room
          io.to("admin_alerts").emit("driver_late_alert_admin", {
            message: `Driver ${t.driver.fullName || t.driver._id} on Bus ${t.driver.busCode || "N/A"} has NOT started the ${t.route.name} trip scheduled for ${startDate.toLocaleTimeString()}.`,
            driverId: t.driver._id,
            tripId: trip._id,
          });

          // Persist admin notification (optional but helpful)
          // Use a placeholder ObjectId for admin user (replace with real admin ID if available)
          const adminUserId = new mongoose.Types.ObjectId();
          await Notification.create({
            user: adminUserId,
            title: "Late Trip Alert",
            message: `Driver ${t.driver.fullName || t.driver._id} has not started the trip for ${t.route.name}.`,
            type: "driver_late_alert",
            read: false,
          });

          // Mark flag
          t.lateAlertSent = true;
          await t.save();
        }
      }
    } catch (err) {
      console.error("[Cron Error: Driver Reminder]", err);
    }
  });

  console.log("✅ Driver reminder cron job started (runs every 5 minutes)");
};
