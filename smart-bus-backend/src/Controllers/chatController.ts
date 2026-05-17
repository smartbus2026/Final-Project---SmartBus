import mongoose from "mongoose"; // 🟢 لازم نستورد mongoose للتحقق من الـ ID
import Message from "../models/chat";
import Booking from "../models/Booking.model";
import Trip from "../models/Trip";
import { getIO } from "../socket"; 

export const sendMessage = async (req: any, res: any) => {
  try {
    const { tripId } = req.params;
    const { message } = req.body;

    // 🟢 1. التحقق إن الـ tripId مبعوث صح ومش كلمة "default"
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ message: "Invalid Trip ID format. Received: " + tripId });
    }
    
    const trip: any = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }

    const timeSlotMap: any = {
      "morning": "Morning",
      "return_1530": "Return",
      "return_1900": "Return"
    };

    // Validate if user has booked this trip
    const userBooking = await Booking.findOne({ 
      route: trip.route,
      date: trip.date,
      timeSlot: timeSlotMap[trip.time_slot],
      user: req.user.id, 
      status: { $in: ["active", "pending", "completed"] }
    }); 
    if (!userBooking && req.user.role !== "admin") { 
        return res.status(403).json({ message: "You are not registered for this route on this date." }); 
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

    const trip: any = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }

    const timeSlotMap: any = {
      "morning": "Morning",
      "return_1530": "Return",
      "return_1900": "Return"
    };

    // Validate if user has booked this trip
    const userBooking = await Booking.findOne({ 
      route: trip.route,
      date: trip.date,
      timeSlot: timeSlotMap[trip.time_slot],
      user: req.user.id, 
      status: { $in: ["active", "pending", "completed"] }
    }); 
    if (!userBooking && req.user.role !== "admin") { 
        return res.status(403).json({ message: "You are not registered for this route on this date." }); 
    }

    const messages = await Message.find({ trip: tripId }).sort({ createdAt: 1 }).populate("sender", "name"); //[cite: 1, 6]
    res.json(messages); //[cite: 6]
  } catch (err: any) {
    console.error("[Chat Controller Error]:", err.message);
    res.status(500).json({ error: err.message }); //[cite: 6]
  }
};