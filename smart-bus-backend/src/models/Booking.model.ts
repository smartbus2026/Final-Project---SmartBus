import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  trip: mongoose.Types.ObjectId;
  pickup_point: mongoose.Types.ObjectId;
  seat_number: number;
  status: "active" | "cancelled" | "completed" | "missed";
  attended: boolean;
}

const bookingSchema = new Schema<IBooking>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
  pickup_point: { type: Schema.Types.ObjectId, ref: "Stop", required: true },
  seat_number: { type: Number, required: true },
  status: {
    type: String,
    enum: ["active", "cancelled", "completed", "missed"],
    default: "active"
  },
  attended: { type: Boolean, default: false }
}, { timestamps: true });

bookingSchema.index({ user: 1, trip: 1 }, { unique: true });

export default mongoose.model<IBooking>("Booking", bookingSchema);