import mongoose from "mongoose"; // 🟢 لازم نستورد mongoose للتحقق من الـ ID
import Message from "../models/chat";
import Booking from "../models/Booking.model";
import { getIO } from "../socket"; 

export const sendMessage = async (req: any, res: any) => {
  try {
    const { tripId } = req.params;
    const { message } = req.body;

    // 🟢 1. التحقق إن الـ tripId مبعوث صح ومش كلمة "default"
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ message: "Invalid Trip ID format. Received: " + tripId });
    }
    
    // Validate if user has booked this trip[cite: 6]
    const userBooking = await Booking.findOne({ trip: tripId, user: req.user.id, status: "active" }); //[cite: 6]
    if (!userBooking && req.user.role !== "admin") { //[cite: 6]
        return res.status(403).json({ message: "You are not registered for this trip." }); //[cite: 6]
    }

    let newMessage = await Message.create({ //[cite: 6]
      sender: req.user.id, //[cite: 6]
      trip: tripId, //[cite: 6]
      message //[cite: 6]
    });

    newMessage = await newMessage.populate("sender", "name"); //[cite: 1, 6]

    // إرسال الرسالة عبر السوكيت[cite: 4, 6]
    getIO().to(`trip:${tripId}`).emit("new-message", newMessage); //[cite: 4, 6]

    res.status(201).json(newMessage); //[cite: 6]
  } catch (err: any) {
    console.error("[Chat Controller Error]:", err.message); // عشان تشوفي الخطأ في الـ Terminal
    res.status(500).json({ error: err.message }); //[cite: 6]
  }
};

export const getMessages = async (req: any, res: any) => {
  try {
    const { tripId } = req.params; 

    // 🟢 2. نفس التحقق هنا لمنع الـ 500 Error
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ message: "Invalid Trip ID format." });
    }

    // Validate if user has booked this trip[cite: 6]
    const userBooking = await Booking.findOne({ trip: tripId, user: req.user.id, status: "active" }); //[cite: 6]
    if (!userBooking && req.user.role !== "admin") { //[cite: 6]
        return res.status(403).json({ message: "You are not registered for this trip." }); //[cite: 6]
    }

    const messages = await Message.find({ trip: tripId }).sort({ createdAt: 1 }).populate("sender", "name"); //[cite: 1, 6]
    res.json(messages); //[cite: 6]
  } catch (err: any) {
    console.error("[Chat Controller Error]:", err.message);
    res.status(500).json({ error: err.message }); //[cite: 6]
  }
};