import mongoose, { Schema, Document } from "mongoose";

export interface ITrip extends Document {
  route: mongoose.Types.ObjectId;
  date: Date;
  time_slot: "morning" | "return_1530" | "return_1900"; 
  total_seats: number;
  booked_seats: number;
  status: "scheduled" | "active" | "completed" | "cancelled"; 
  current_location: {
    lat: number;
    lng: number;
    last_updated: Date;
  };
}

const tripSchema = new Schema<ITrip>({
  route: { type: Schema.Types.ObjectId, ref: "Route", required: true },
  date: { type: Date, required: true },
  
  time_slot: { 
    type: String, 
    enum: ["morning", "return_1530", "return_1900"], 
    required: true 
  },
  
  total_seats: { type: Number, required: true },
  booked_seats: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["scheduled", "active", "completed", "cancelled"],
    default: "scheduled"
  },
  current_location: {
    lat: Number,
    lng: Number,
    last_updated: Date
  }
}, { timestamps: true });

tripSchema.index({ route: 1, date: 1, time_slot: 1 }, { unique: true });

export default mongoose.model<ITrip>("Trip", tripSchema);