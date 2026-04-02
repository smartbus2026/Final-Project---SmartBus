import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  student_id: mongoose.Types.ObjectId;
  trip_id: mongoose.Types.ObjectId;
  pickup_point: string;
  status: "pending" | "attended" | "missed";
}

const bookingSchema = new Schema<IBooking>({
  student_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  trip_id: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
  pickup_point: { type: String, required: true },
  status: { type: String, enum: ["pending", "attended", "missed"], default: "pending" }
}, { timestamps: true });

export default mongoose.model<IBooking>("Booking", bookingSchema);