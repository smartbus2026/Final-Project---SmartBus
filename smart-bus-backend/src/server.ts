import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./Routes/userRoutes";
import routeRoutes from "./Routes/routeRoutes";
import tripRoutes from "./Routes/tripRoutes";
import bookingRoutes from "./Routes/bookingRoutes";
import notificationRoutes from "./Routes/notificationsRoutes";
import chatRoutes from "./Routes/chatRoutes";

import authRoutes from "./Routes/authRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", chatRoutes);



mongoose
  .connect(process.env.MONGO_URI || "")
  .then(() => {
    console.log(" Connected to MongoDB Atlas successfully");
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      app.get("/", (req, res) => {
  res.send("API is running ");
});
    });
  })
  .catch((err) => {
    console.error(" MongoDB Connection Error:", err.message);
  });