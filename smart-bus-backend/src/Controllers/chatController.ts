import Message from "../models/chat";


export const sendMessage = async (req: any, res: any) => {
  try {
    const { tripId, message } = req.body; 
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
    const messages = await Message.find({ trip: tripId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};