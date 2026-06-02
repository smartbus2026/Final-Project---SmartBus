import mongoose, { Schema, Document } from "mongoose";

export interface IQuota extends Document {
  monthYear: string;       // e.g., "05-2026"
  totalCapacity: number;   // default 280 (can be overridden by settings)
  usedCapacity: number;    // default 0
}

const quotaSchema = new Schema<IQuota>({
  monthYear: { type: String, required: true, unique: true },
  totalCapacity: { type: Number, default: 280 },
  usedCapacity: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IQuota>("Quota", quotaSchema);
