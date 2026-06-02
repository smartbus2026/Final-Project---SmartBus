import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
  defaultShiftLimit: number; // Max buses per shift before warning.
  monthlyBusQuota: number; // Total allowed bus assignments per month.
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    defaultShiftLimit: { type: Number, default: 7, min: 1 },
    monthlyBusQuota: { type: Number, default: 280, min: 1 }
  },
  { timestamps: true }
);

export default mongoose.model<ISystemSettings>("SystemSettings", systemSettingsSchema);
