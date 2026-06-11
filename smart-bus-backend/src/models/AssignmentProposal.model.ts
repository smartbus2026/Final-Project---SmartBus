import mongoose, { Schema, Document } from "mongoose";

export interface IAssignmentProposal extends Document {
  targetDate: Date;
  tripType: string;
  assignments: {
    busNumber: string;
    busId: mongoose.Types.ObjectId | null;
    driverId: mongoose.Types.ObjectId | null;
    studentBookings: mongoose.Types.ObjectId[];
  }[];
  status: "pending" | "approved_by_admin" | "auto_approved";
  deadline: Date;
  reminderSent: boolean;
  createdAt: Date;
}

const assignmentProposalSchema = new Schema<IAssignmentProposal>({
  targetDate: { type: Date, required: true },
  tripType: { type: String, enum: ["Morning", "Return"], required: true },
  assignments: [{
    busNumber: { type: String, required: true },
    busId: { type: Schema.Types.ObjectId, ref: "Bus", default: null },
    driverId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    studentBookings: [{ type: Schema.Types.ObjectId, ref: "Booking" }]
  }],
  status: { type: String, enum: ["pending", "approved_by_admin", "auto_approved"], default: "pending" },
  deadline: { type: Date, required: true },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IAssignmentProposal>("AssignmentProposal", assignmentProposalSchema);
