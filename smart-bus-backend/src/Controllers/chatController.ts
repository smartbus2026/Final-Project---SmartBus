import Message from "../models/chat";

export const sendMessage = async (req: any, res: any) => {
  try {
    const { receiver, message } = req.body;

    const newMessage = await Message.create({
      sender: req.user.id,
      receiver,
      message
    });

    res.status(201).json(newMessage);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ createdAt: -1 });

    res.json(messages);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};