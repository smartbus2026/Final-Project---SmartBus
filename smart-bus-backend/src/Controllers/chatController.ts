import { Request, Response } from "express";
import Message from "../models/chat";
import Booking from "../models/Booking.model";
import Settings from "../models/Settings.model";
import Trip from "../models/Trip";
import { getIO } from "../socket"; 

export const getActiveGroupChat = async (req: any, res: any) => {
  try {
    // 1. Find the student's most recent non-cancelled booking on any route
    const booking = await Booking.findOne({
      user: req.user.id,
      status: { $nin: ["cancelled", "completed", "missed"] }
    }).populate("route", "name").sort({ createdAt: -1 });

    if (!booking || !booking.route) {
      return res.status(200).json({
        isOpen: false,
        message: "No active booking found."
      });
    }

    // Safely extract route _id and name
    const routeObj: any = booking.route;
    const routeId = routeObj._id ? routeObj._id.toString() : routeObj.toString();
    const routeName = routeObj.name || "Unknown Route";

    // 2. Find the most recently updated trip for this route/timeslot
    const tripQuery: any = { route: routeId };
    if (booking.timeSlot === "Morning") {
      tripQuery.time_slot = "morning";
    } else {
      tripQuery.time_slot = { $in: ["return_1530", "return_1900"] };
    }
    const trip = await Trip.findOne(tripQuery).sort({ updatedAt: -1 });

    // 3. If the trip is completed or cancelled, close the chat
    if (trip && (trip.status === "completed" || trip.status === "cancelled")) {
      return res.status(200).json({
        isOpen: false,
        message: "This chat has been closed as the trip ended."
      });
    }

    // 4. Build a stable roomId from route + booking date + timeslot
    const bookingDateStr = new Date(booking.date).toISOString().split("T")[0];
    const roomId = `${routeId}_${bookingDateStr}_${booking.timeSlot}`;

    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).populate("sender", "name");

    return res.status(200).json({
      isOpen: true,
      roomId,
      routeName,
      timeSlot: booking.timeSlot,
      messages,
      tripStatus: trip?.status || "scheduled",
      tripId: trip?._id
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