import mongoose, { Schema, Document } from "mongoose";

export interface ITrip extends Document {
  route_id: mongoose.Types.ObjectId;
  bus_number: string;
  departure_time: Date;
  status: "not_started" | "active" | "completed";
  active_tracker_id?: mongoose.Types.ObjectId; 
   total_seats: number;
  current_location?: { lat: Number; lng: Number; last_updated: Date };
}

const tripSchema = new Schema<ITrip>({
  route_id: { type: Schema.Types.ObjectId, ref: "Route", required: true },
  bus_number: { type: String, required: true },
  departure_time: { type: Date, required: true },
  status: { type: String, enum: ["not_started", "active", "completed"], default: "not_started" },
  active_tracker_id: { type: Schema.Types.ObjectId, ref: "User" },
  total_seats: { type: Number, required: true },
  current_location: {
    lat: Number,
    lng: Number,
    last_updated: { type: Date, default: Date.now }
  }
});

export default mongoose.model<ITrip>("Trip", tripSchema);