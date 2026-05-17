import { Request, Response } from "express";
import Message from "../models/chat";
import Booking from "../models/Booking.model";
import Settings from "../models/Settings.model";
import { getIO } from "../socket"; 

export const getActiveGroupChat = async (req: any, res: any) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get closest upcoming booking for today
    const booking = await Booking.findOne({
      user: req.user.id,
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ["pending", "assigned", "active"] }
    }).populate("route", "name").sort({ createdAt: 1 });

    if (!booking) {
      return res.json({ isOpen: false, message: "You don't have any active bookings for today." });
    }

    const settings: any = await Settings.findOne();
    if (!settings) {
      return res.status(500).json({ error: "System settings not configured." });
    }

    let tripTimeStr = "";
    if (booking.timeSlot === "Morning") {
      tripTimeStr = settings.morningStartTime || "08:30 AM";
    } else {
      tripTimeStr = booking.specificReturnTime || "03:30 PM"; 
    }

    const parseTimeToMinutes = (t: string) => {
      if (!t) return 0;
      const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) return 0;
      let h = parseInt(m[1]);
      const min = parseInt(m[2]);
      if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
      if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
      return h * 60 + min;
    };

    const tripStartMin = parseTimeToMinutes(tripTimeStr);
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();

    const windowStart = tripStartMin - 30; // opens 30 min before

    if (curMin < windowStart && req.user.role !== "admin") {
      return res.json({ isOpen: false, message: `Chat will open 30 minutes before your ${tripTimeStr} trip.` });
    }

    const dateStr = todayStart.toISOString().split("T")[0];
    const routeObj: any = booking.route;
    const roomId = `${routeObj._id}_${dateStr}_${booking.timeSlot}`;

    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).populate("sender", "name");

    return res.json({
      isOpen: true,
      roomId,
      routeName: routeObj.name,
      timeSlot: booking.timeSlot,
      messages
    });

  } catch (err: any) {
    console.error("[Chat Controller Error]:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const sendMessage = async (req: any, res: any) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;

    if (!roomId) return res.status(400).json({ message: "Room ID is required." });

    let newMessage = await Message.create({
      sender: req.user.id,
      roomId,
      message
    });

    newMessage = await newMessage.populate("sender", "name");

    // Broadcast to students inside this specific route/time group
    getIO().to(roomId).emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (err: any) {
    console.error("[Chat Controller Send Error]:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req: any, res: any) => {
  try {
    const { roomId } = req.params; 
    if (!roomId) return res.status(400).json({ message: "Room ID is required." });

    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).populate("sender", "name");
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};