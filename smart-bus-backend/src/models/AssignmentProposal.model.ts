import mongoose, { Schema, Document } from "mongoose";

export interface IAssignmentProposal extends Document {
  targetDate: Date;
  tripType: string;
  assignments: {
    busNumber: string;
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
    studentBookings: [{ type: Schema.Types.ObjectId, ref: "Booking" }]
  }],
  status: { type: String, enum: ["pending", "approved_by_admin", "auto_approved"], default: "pending" },
  deadline: { type: Date, required: true },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IAssignmentProposal>("AssignmentProposal", assignmentProposalSchema);
