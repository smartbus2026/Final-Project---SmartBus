import cron from "node-cron";
import AssignmentProposal from "../models/AssignmentProposal.model";
import AppNotification from "../models/Notification.model";
import User from "../models/User";
import { assignBusToBooking } from "../services/adminServices";

// The Reminder Cron Job
const startProposalReminderJob = () => {
    // Runs every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
        try {
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

            // Find pending proposals where deadline is less than 60 mins away and no reminder sent yet
            const proposals = await AssignmentProposal.find({
                status: "pending",
                deadline: { $lte: oneHourFromNow, $gt: now },
                reminderSent: false
            });

            if (proposals.length === 0) return;

            const admins = await User.find({ role: "admin" }).select("_id").lean();
            if (admins.length === 0) return;

            for (const proposal of proposals) {
                const diffMs = proposal.deadline.getTime() - now.getTime();
                const diffMins = Math.max(0, Math.floor(diffMs / 60000));

                const notifications = admins.map(admin => ({
                    userId: admin._id,
                    message: `URGENT: AI Bus Assignment proposal for ${proposal.tripType} (${proposal.targetDate.toDateString()}) will automatically approve in less than ${diffMins} minutes. Please review it now!`
                }));

                await AppNotification.insertMany(notifications);

                // Mark reminder as sent
                proposal.reminderSent = true;
                await proposal.save();
            }
            console.log(`[Cron] Sent reminders for ${proposals.length} pending proposals.`);
        } catch (error) {
            console.error("[Cron Error: Proposal Reminder]", error);
        }
    });
};

// The Auto-Approve Fallback Cron Job
const startAutoApproveFallbackJob = () => {
    // Runs every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        try {
            const now = new Date();

            const proposals = await AssignmentProposal.find({
                status: "pending",
                deadline: { $lte: now }
            });

            if (proposals.length === 0) return;

            const admins = await User.find({ role: "admin" }).select("_id").lean();
            const SYSTEM_ADMIN_ID = "000000000000000000000000"; // Dummy ID for automated system

            for (const proposal of proposals) {
                try {
                    // Step 1: Update status
                    proposal.status = "auto_approved";
                    await proposal.save();

                    // Step 2: Execute Fallback Loop
                    let assignedCount = 0;
                    for (const assignment of proposal.assignments) {
                        for (const bookingId of assignment.studentBookings) {
                            try {
                                await assignBusToBooking(bookingId.toString(), assignment.busNumber, SYSTEM_ADMIN_ID);
                                assignedCount++;
                            } catch (err: any) {
                                console.error(`[Cron] Failed to assign bus ${assignment.busNumber} to booking ${bookingId}:`, err.message);
                            }
                        }
                    }

                    // Step 3: Audit Trail to Admins
                    if (admins.length > 0) {
                        const auditNotifications = admins.map(admin => ({
                            userId: admin._id,
                            message: `System fallback activated: AI Assignment proposal for ${proposal.tripType} on ${proposal.targetDate.toDateString()} was automatically approved as the deadline passed. Assigned ${assignedCount} bookings.`
                        }));
                        await AppNotification.insertMany(auditNotifications);
                    }

                    console.log(`[Cron] Auto-approved proposal ${proposal._id}.`);
                } catch (innerError) {
                    console.error(`[Cron] Failed to auto-approve proposal ${proposal._id}:`, innerError);
                }
            }
        } catch (error) {
            console.error("[Cron Error: Auto-Approve Fallback]", error);
        }
    });
};

export const initCronJobs = () => {
    startProposalReminderJob();
    startAutoApproveFallbackJob();
    console.log("✅ Background Proposal Cron Jobs initialized.");
};
