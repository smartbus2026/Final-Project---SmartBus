import mongoose, { Schema, Document } from "mongoose";

export interface IRoute extends Document {
  route_name: string;
  start_location: { lat: Number; lng: Number };
  end_location: { lat: Number; lng: Number };
  stops: { stop_name: string; lat: Number; lng: Number }[];
}

const routeSchema = new Schema<IRoute>({
  route_name: { type: String, required: true },
  start_location: { lat: Number, lng: Number },
  end_location: { lat: Number, lng: Number },
  stops: [{
    stop_name: String,
    lat: Number,
    lng: Number
  }]
});

export default mongoose.model<IRoute>("Route", routeSchema);