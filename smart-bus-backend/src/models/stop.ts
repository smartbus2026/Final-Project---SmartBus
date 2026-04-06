import mongoose, { Schema, Document } from "mongoose";

export interface IStop extends Document {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}

const stopSchema = new Schema<IStop>({
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
});

const Stop = mongoose.model<IStop>("Stop", stopSchema);
export default Stop;