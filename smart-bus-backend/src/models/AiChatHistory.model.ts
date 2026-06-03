import mongoose, { Schema, Document } from "mongoose";

export interface IAiChatHistory extends Document {
  user: mongoose.Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiChatHistorySchema = new Schema<IAiChatHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAiChatHistory>("AiChatHistory", aiChatHistorySchema);
