import mongoose, { Document, Schema } from "mongoose";

interface IGeoPoint {
  lat: number;
  lng: number;
}

export interface IBus extends Document {
  busCode: string;
  route: mongoose.Types.ObjectId;
  driverName: string;
  speedKmh: number;
  capacity?: number;
  isActive: boolean;
  currentLocation: IGeoPoint;
  currentStop?: mongoose.Types.ObjectId;
  nextStop?: mongoose.Types.ObjectId;
  etaMinutes?: number;
  lastGpsUpdateAt: Date;
}

const busSchema = new Schema<IBus>(
  {
    busCode: { type: String, required: true, unique: true, trim: true },
    route: { type: Schema.Types.ObjectId, ref: "Route", required: true },
    driverName: { type: String, required: true, trim: true },
    speedKmh: { type: Number, default: 0 },
    capacity: { type: Number },
    isActive: { type: Boolean, default: true },
    currentLocation: {
      lat: { type: Number, required: true, default: 30.0444 },
      lng: { type: Number, required: true, default: 31.2357 },
    },
    currentStop: { type: Schema.Types.ObjectId, ref: "Stop" },
    nextStop: { type: Schema.Types.ObjectId, ref: "Stop" },
    etaMinutes: { type: Number },
    lastGpsUpdateAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IBus>("Bus", busSchema);
