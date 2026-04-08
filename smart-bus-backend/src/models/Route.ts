// models/Route.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IRoute extends Document {
  name: string;
  distance: string;
  duration: string;
  startTime: string; 
  startLocation: { lat: number; lng: number }; 
  stops: mongoose.Types.ObjectId[];
}

const routeSchema = new Schema<IRoute>({
  name: { type: String, required: true, unique: true },
  distance: { type: String }, 
  duration: { type: String },
  stops: [{ type: Schema.Types.ObjectId, ref: "Stop" }]
});

export default mongoose.model<IRoute>("Route", routeSchema);