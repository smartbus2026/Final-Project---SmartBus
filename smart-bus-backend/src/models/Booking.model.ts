import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  route: mongoose.Types.ObjectId;
  date: Date;
  timeSlot: "Morning" | "Return";
  specificReturnTime?: string;
  status: "pending" | "assigned" | "active" | "cancelled" | "completed" | "missed";
  busId?: mongoose.Types.ObjectId;
  attendanceStatus: "pending" | "completed" | "missed";
  attended: boolean;
}

const bookingSchema = new Schema<IBooking>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  route: { type: Schema.Types.ObjectId, ref: "Route", required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, enum: ["Morning", "Return"], required: true },
  specificReturnTime: { type: String },
  busId: { type: Schema.Types.ObjectId, ref: "Bus" },
  status: {
    type: String,
    enum: ["pending", "assigned", "active", "cancelled", "completed", "missed"],
    default: "pending"
  },
  attendanceStatus: {
    type: String,
    enum: ["pending", "completed", "missed"],
    default: "pending"
  },
  attended: { type: Boolean, default: false }
}, { timestamps: true });

bookingSchema.index({ user: 1, route: 1, date: 1, timeSlot: 1 }, { unique: true });

export default mongoose.model<IBooking>("Booking", bookingSchema);