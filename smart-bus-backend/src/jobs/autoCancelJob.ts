import cron from "node-cron";
import Booking from "../models/Booking.model";

export const runCleanupNow = async () => {
  try {
    const pastDateStranded = new Date();
    pastDateStranded.setUTCHours(0, 0, 0, 0);

    const result = await Booking.updateMany(
      {
        date: { $lt: pastDateStranded },
        status: { $in: ["pending", "booked"] },
        $or: [{ busId: { $exists: false } }, { busId: null }]
      },
      {
        $set: { status: "cancelled" }
      }
    );

    console.log(`[System Cleanup] Auto-cancelled ${result.modifiedCount} stranded past bookings.`);
  } catch (error) {
    console.error("[Cleanup Error]", error);
  }
};

export const startAutoCancelJob = () => {
  // Run daily at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Find bookings for today that are still pending and have no bus assigned
      const result = await Booking.updateMany(
        {
          date: { $gte: todayStart, $lte: todayEnd },
          status: "pending",
          busId: { $exists: false } // busId is undefined or null
        },
        {
          $set: { status: "cancelled" }
        }
      );

      // Also update where busId is explicitly null
      const result2 = await Booking.updateMany(
        {
          date: { $gte: todayStart, $lte: todayEnd },
          status: "pending",
          busId: null
        },
        {
          $set: { status: "cancelled" }
        }
      );

      console.log(`[Auto-Cancel] Cancelled ${result.modifiedCount + result2.modifiedCount} pending bookings for today without a bus.`);
    } catch (error) {
      console.error("[Cron Error: Auto-Cancel]", error);
    }
  });

  console.log("✅ Auto-Cancel job scheduled at 08:00 AM daily.");
};
