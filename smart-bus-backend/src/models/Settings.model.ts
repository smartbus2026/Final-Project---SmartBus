import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  booking_open_hour: number;   // مثلاً 20 = 8 مساءً
  booking_open_minute: number;
  booking_close_hour: number;  // مثلاً 23 = 11 مساءً
  booking_close_minute: number;
  returnTimeOptions: string[];
  morningStartTime: string;
}

const settingsSchema = new Schema<ISettings>({
  booking_open_hour:    { type: Number, default: 20 },
  booking_open_minute:  { type: Number, default: 0 },
  booking_close_hour:   { type: Number, default: 23 },
  booking_close_minute: { type: Number, default: 0 },
  returnTimeOptions: { type: [String], default: ["3:30 PM", "7:00 PM"] },
  morningStartTime: { type: String, default: "08:30 AM" },
});

export default mongoose.model<ISettings>("Settings", settingsSchema);