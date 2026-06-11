import cron from "node-cron";
import AssignmentProposal from "../models/AssignmentProposal.model";
import AppNotification from "../models/Notification.model";
import Booking from "../models/Booking.model";
import Bus from "../models/Bus";
import User from "../models/User";

export const initAutoConfirmDispatcher = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Find proposals that have passed their deadline and are still pending
      const expiredProposals = await AssignmentProposal.find({
        status: "pending",
        deadline: { $lte: now }
      });

      if (expiredProposals.length === 0) return;

      for (const proposal of expiredProposals) {
        // 1. Mark as auto-approved
        proposal.status = "auto_approved";
        await proposal.save();

        // 2. Dispatch the buses: Update bookings to "assigned" and set the busId
        for (const assignment of proposal.assignments) {
          // Find the bus by busNumber (busCode) to get its ObjectId
          const bus = await Bus.findOne({ busCode: assignment.busNumber });
          if (!bus) continue;

          // Update all bookings in this assignment
          await Booking.updateMany(
            { _id: { $in: assignment.studentBookings } },
            { 
              $set: { 
                status: "assigned", 
                busId: bus._id 
              } 
            }
          );
        }

        // 3. Send Notification to Admins
        const admins = await User.find({ role: "admin" }).select("_id").lean();
        const notifications = admins.map(admin => ({
          userId: admin._id,
          message: `The dispatch plan for ${proposal.tripType} on ${proposal.targetDate.toISOString().split('T')[0]} was auto-confirmed and buses have been dispatched.`,
          isRead: false
        }));

        if (notifications.length > 0) {
          await AppNotification.insertMany(notifications);
        }

        console.log(`[AutoConfirmDispatcher] Proposal ${proposal._id} has been auto-approved.`);
      }
    } catch (error) {
      console.error("[AutoConfirmDispatcher] Error during auto-confirmation:", error);
    }
  });

  console.log("[Jobs] AutoConfirmDispatcher cron job initialized.");
};
