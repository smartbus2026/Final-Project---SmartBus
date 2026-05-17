import Message from "../models/chat";
import { getIO } from "../socket"; 

export const sendMessage = async (req: any, res: any) => {
  try {
    const { message } = req.body;

    let newMessage = await Message.create({
      sender: req.user.id,
      message
    });

    newMessage = await newMessage.populate("sender", "name");


    getIO().emit("new-message", newMessage);

    res.status(201).json(newMessage);
  } catch (err: any) {
    console.error("[Chat Controller Error]:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req: any, res: any) => {
  try {
  
    const messages = await Message.find().sort({ createdAt: 1 }).populate("sender", "name");
    res.json(messages);
  } catch (err: any) {
    console.error("[Chat Controller Error]:", err.message);
    res.status(500).json({ error: err.message });
  }
};