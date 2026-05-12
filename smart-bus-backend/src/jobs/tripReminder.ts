import cron from "node-cron";
import Trip from "../models/Trip";
import Booking from "../models/Booking.model";
import Notification from "../models/notification";

export const startTripReminderJob = () => {
  // بيشتغل كل دقيقة
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const in30Min = new Date(now.getTime() + 30 * 60 * 1000);

      // جيب الـ trips اللي هتبدأ خلال 30 دقيقة
      const upcomingTrips = await Trip.find({
        date: { $gte: now, $lte: in30Min },
        status: "scheduled"
      });

      for (const trip of upcomingTrips) {
        // جيب الـ bookings بتاعت الرحلة دي
        const bookings = await Booking.find({
          trip: trip._id,
          status: "active"
        });

        for (const booking of bookings) {
          // تحقق إن مفيش notification اتبعتت قبل كده لنفس الرحلة
          const alreadySent = await Notification.findOne({
            user: booking.user,
            type: "trip",
            message: { $regex: trip._id.toString() }
          });

          if (!alreadySent) {
            await Notification.create({
              user: booking.user,
              title: "🚌 Bus Arriving Soon!",
              message: `Your bus is arriving in 30 minutes (Trip ID: ${trip._id}). Please be ready and board the bus to mark your attendance.`,
              type: "trip",
              read: false
            });
          }
        }
      }
    } catch (err) {
      console.error("Trip reminder job error:", err);
    }
  });

  console.log("✅ Trip reminder cron job started");
};