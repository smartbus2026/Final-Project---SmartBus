import { Request, Response } from "express";
import Notification from "../models/notification";
import User from "../models/User"; 

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const notifications = await Notification.find({
      user: user.id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: { notifications }
    });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const notif = await Notification.findById(req.params.id);

    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notif.read = true;
    await notif.save();

    res.status(200).json({ status: "success", message: "Marked as read" });

  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const broadcastNotification = async (req: Request, res: Response) => {
  try {
    const { title, message, target } = req.body;

    let query = {};
    if (target === "Students Only" || target === "student") query = { role: "student" };
    else if (target === "Admins Only" || target === "admin") query = { role: "admin" };

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

    res.status(201).json({ status: "success", message: `Broadcasted successfully to ${users.length} users.` });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

// ── createNotificationIfNotExists ── بتستخدمها الـ trackingController
export const createNotificationIfNotExists = async ({
  userId,
  busId,
  routeId,
  stopId,
  type,
  title,
  message,
  eventKey,
}: {
  userId: string;
  busId: string;
  routeId: string;
  stopId?: string;
  type: string;
  title: string;
  message: string;
  eventKey: string;
}) => {
  try {
    const existing = await Notification.findOne({ 
      user: userId, 
      message: { $regex: eventKey }
    });
    
    if (!existing) {
      await Notification.create({
        user: userId,
        title,
        message: `${message} [${eventKey}]`,
        type: "trip",
        read: false
      });
    }
  } catch (err) {
    console.error("createNotificationIfNotExists error:", err);
  }
};