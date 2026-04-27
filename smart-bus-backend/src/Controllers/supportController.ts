import { Request, Response } from "express";
import SupportTicket from "../models/SupportTicket";
import Notification from "../models/notification";
import User from "../models/User";

// ── Student: Submit a new support ticket ─────────────────────────────────────
export const createTicket = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { subject, description } = req.body;

    if (!subject?.trim()) {
      return res.status(400).json({ message: "Subject is required." });
    }

    const ticket = await SupportTicket.create({
      user: user.id,
      subject,
      description,
    });

    // Notify all admin users about the new ticket
    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user: admin._id,
        title: "New Support Ticket",
        message: `Student submitted a new ticket: "${subject}"`,
        type: "general",
        read: false,
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      status: "success",
      message: "Ticket submitted successfully.",
      data: { ticket },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

// ── Student: Get own tickets ──────────────────────────────────────────────────
export const getMyTickets = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tickets = await SupportTicket.find({ user: user.id }).sort("-createdAt");
    res.status(200).json({ status: "success", data: { tickets } });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

// ── Admin: Get all tickets ────────────────────────────────────────────────────
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("user", "name email student_id")
      .sort("-createdAt");
    res.status(200).json({ status: "success", data: { tickets } });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

// ── Admin: Update ticket status ───────────────────────────────────────────────
export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["open", "pending", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const ticket: any = await SupportTicket.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("user", "name email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    // Notify the student about the status change
    await Notification.create({
      user: ticket.user._id,
      title: "Support Ticket Updated",
      message: `Your ticket "${ticket.subject}" has been marked as ${status}.`,
      type: "general",
    });

    res.status(200).json({
      status: "success",
      message: "Ticket status updated.",
      data: { ticket },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};
