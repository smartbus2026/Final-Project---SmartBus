import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "student" | "admin" | "driver";
  student_id?: string; 
  profile_pic?: string;
  phone_number?: string;
  isArchived: boolean;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "admin", "driver"], default: "student" },
  student_id: { type: String, unique: true, sparse: true },
  profile_pic: { type: String, default: "default-avatar.png" },
  phone_number: { type: String },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IUser>("User", userSchema);