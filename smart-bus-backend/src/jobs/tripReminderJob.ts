import cron from "node-cron";
import Booking from "../models/Booking.model";
import Notification from "../models/notification";
import Settings from "../models/Settings.model";
import { getIO } from "../socket";

export const startStudentTripReminderJob = () => {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      
      const settings = await Settings.findOne();
      const defaultMorningStr = settings?.morningStartTime || "07:30 AM";

      const parseTimeStrToMinutes = (t: string): number => {
        if (!t) return 0;
        const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!m) return 0;
        let h = parseInt(m[1]);
        const min = parseInt(m[2]);
        if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
        if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
        return h * 60 + min;
      };

      // Get bookings that are assigned
      const assignedBookings = await Booking.find({
        status: "assigned"
      });

      for (const booking of assignedBookings) {
        if (!booking.date) continue;

        const bookingDate = new Date(booking.date);
        
        let startMinutes = 0;
        if (booking.timeSlot === "Morning") {
          startMinutes = parseTimeStrToMinutes(defaultMorningStr);
        } else if (booking.timeSlot === "Return" && booking.specificReturnTime) {
          startMinutes = parseTimeStrToMinutes(booking.specificReturnTime);
        } else {
          continue; // Cannot determine start time
        }

        const startTime = new Date(bookingDate);
        startTime.setHours(0, 0, 0, 0);
        startTime.setMinutes(startMinutes);

        const diffMs = now.getTime() - startTime.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours >= 2) {
          // Check if notification already sent
          const alreadySent = await Notification.findOne({
            user: booking.user,
            type: "trip",
            title: "Trip Status Reminder",
            message: { $regex: booking._id.toString() } // include booking id to ensure one per booking
          });

          if (!alreadySent) {
            const msg = `Did you complete your trip? Please update status. (Booking: ${booking._id})`;
            
            await Notification.create({
              user: booking.user,
              title: "Trip Status Reminder",
              message: msg,
              type: "trip",
              read: false
            });

            try {
              const io = getIO();
              io.to(`user:${booking.user.toString()}`).emit("trip_reminder", { message: "Did you complete your trip? Please update status." });
            } catch (ioError) {
              console.error("[Cron Error: Trip Reminder Socket Emit]", ioError);
            }
          }
        }
      }
    } catch (err) {
      console.error("[Cron Error: Student Trip Reminder]", err);
    }
  });

  console.log("✅ Student trip reminder cron job started (runs every hour)");
};
