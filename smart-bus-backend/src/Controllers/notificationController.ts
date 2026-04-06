import Notification from "../models/notification";

export const getNotifications = async (req: any, res: any) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id
    }).sort({ createdAt: -1 });

    res.json(notifications);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req: any, res: any) => {
  try {
    const notif = await Notification.findById(req.params.id);

    if (!notif) {
      return res.status(404).json({ message: "Not found" });
    }

    notif.read = true;
    await notif.save();

    res.json({ message: "Marked as read" });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};