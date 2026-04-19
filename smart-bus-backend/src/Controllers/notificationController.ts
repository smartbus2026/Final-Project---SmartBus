import Notification from "../models/notification";
import User from "../models/User"; 

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


// //////////////////////////////////////////////admin Notifications//////////////////////////////////////////////
export const broadcastNotification = async (req: any, res: any) => {
  try {
    const { title, message, target } = req.body;

    // 1.   
    let query = {};
    if (target === "Students Only") query = { role: "student" };
    else if (target === "Admins Only") query = { role: "admin" };

    const users = await User.find(query).select("_id");

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found for this target group." });
    }

 
    const notifications = users.map(user => ({
      user: user._id,
      title,
      message,
      type: "general", 
      read: false
    }));

    
    await Notification.insertMany(notifications);

    res.status(201).json({ message: `Broadcasted successfully to ${users.length} users.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};