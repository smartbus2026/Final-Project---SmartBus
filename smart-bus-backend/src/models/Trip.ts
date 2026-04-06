import mongoose, { Schema, Document } from "mongoose";

export interface ITrip extends Document {
  route: mongoose.Types.ObjectId;
  date: Date;
  total_seats: number;
  booked_seats: number;
  status: "scheduled" | "active" | "completed";
  current_location: {
    lat: number;
    lng: number;
    last_updated: Date;
  };
}

const tripSchema = new Schema<ITrip>({
  route: { type: Schema.Types.ObjectId, ref: "Route", required: true },
  date: { type: Date },
  total_seats: { type: Number, required: true },
  booked_seats: { type: Number, default: 0 },
  status: {
  type: String,
  enum: ["scheduled", "active", "completed"],
  default: "scheduled"
},
current_location: {
  lat: Number,
  lng: Number,
  last_updated: Date
}
    

  }
);


export default mongoose.model<ITrip>("Trip", tripSchema);