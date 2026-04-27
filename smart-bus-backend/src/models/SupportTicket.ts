import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicket extends Document {
  user: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  status: "open" | "pending" | "resolved";
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    user:        { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject:     { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["open", "pending", "resolved"],
      default: "open",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ISupportTicket>("SupportTicket", supportTicketSchema);
