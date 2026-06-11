import AssignmentProposal from "../models/AssignmentProposal.model";
import AppNotification from "../models/Notification.model";
import User from "../models/User";
import { generateOptimizationPlan } from "./dispatchOptimization";

export const generateAndSaveDispatchPlan = async (targetDateStr: string, shift: string, time?: string) => {
  const targetDate = new Date(targetDateStr);
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // 1. Generate the optimal assignments
  const assignments = await generateOptimizationPlan(targetDate, shift, time);

  // 2. Remove any old pending proposals for the same date/type to avoid duplicates
  await AssignmentProposal.deleteMany({
    targetDate: { $gte: dayStart, $lte: dayEnd },
    tripType: new RegExp(`^${shift}$`, "i"),
    status: "pending"
  });

  // 3. Set a 15-minute deadline for auto-approval
  const deadline = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  // 4. Save the new Proposal
  const normalizedTripType = shift.charAt(0).toUpperCase() + shift.slice(1).toLowerCase();
  
  const proposal = await AssignmentProposal.create({
    targetDate,
    tripType: normalizedTripType,
    assignments,
    status: "pending",
    deadline
  });

  // 5. Send push notification to all Admins
  const admins = await User.find({ role: "admin" }).select("_id").lean();
  const notifications = admins.map(admin => ({
    userId: admin._id,
    message: `A new dispatch plan is ready for ${normalizedTripType} on ${targetDateStr}. Please confirm.`,
    isRead: false
  }));

  if (notifications.length > 0) {
    await AppNotification.insertMany(notifications);
  }

  return proposal;
};
