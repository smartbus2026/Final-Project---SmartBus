import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  trip: mongoose.Types.ObjectId;
  pickup_point: string;
  seat_number: number;
  status: "active" | "cancelled";
}

const bookingSchema = new Schema<IBooking>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
  pickup_point: { type: String, required: true },
  seat_number: { type: Number, required: true },
  status: {
    type: String,
    enum: ["active", "cancelled"],
    default: "active"
  }
}, { timestamps: true });

export default mongoose.model<IBooking>("Booking", bookingSchema);