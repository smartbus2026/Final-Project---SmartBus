import Message from "../models/chat";
import Booking from "../models/Booking.model";

export const sendMessage = async (req: any, res: any) => {
  try {
    // tripId comes from the URL param /:tripId, not the body
    const { tripId } = req.params;
    const { message } = req.body;
    
    // Validate if user has booked this trip
    const userBooking = await Booking.findOne({ trip: tripId, user: req.user.id, status: "active" });
    if (!userBooking && req.user.role !== "admin") {
        return res.status(403).json({ message: "You are not registered for this trip." });
    }

    const newMessage = await Message.create({
      sender: req.user.id,
      trip: tripId, 
      message
    });
    res.status(201).json(newMessage);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req: any, res: any) => {
  try {
    const { tripId } = req.params; 

    // Validate if user has booked this trip
    const userBooking = await Booking.findOne({ trip: tripId, user: req.user.id, status: "active" });
    if (!userBooking && req.user.role !== "admin") {
        return res.status(403).json({ message: "You are not registered for this trip." });
    }

    const messages = await Message.find({ trip: tripId }).sort({ createdAt: 1 }).populate("sender", "name");
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};