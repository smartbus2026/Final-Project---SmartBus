import mongoose, { Schema, Document } from "mongoose";

export interface IRoute extends Document {
  name: string;
  stops: mongoose.Types.ObjectId[];
}

const routeSchema = new Schema<IRoute>({

name: { type: String, required: true, unique: true },
  stops: [{ type: Schema.Types.ObjectId, ref: "Stop" }]
});

export default mongoose.model<IRoute>("Route", routeSchema);