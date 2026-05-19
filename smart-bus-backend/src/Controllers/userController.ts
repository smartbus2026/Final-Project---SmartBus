import { Request, Response } from "express";
import User from "../models/User";
import Booking from "../models/Booking.model";

// Get all users (admin)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Get logged in user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const fullUser = await User.findById(user.id).select("-password");

    res.json(fullUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



export const deleteUser = async (req: Request, res: Response) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get a student's full profile + attendance history
export const getStudentAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId).select("-password");
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const bookings = await Booking.find({
      user: studentId,
      attendanceStatus: { $in: ["completed", "missed"] }
    })
      .populate("route", "name")
      .sort({ date: -1 });

    const completed = bookings.filter((b: any) => b.attendanceStatus === "completed").length;
    const missed    = bookings.filter((b: any) => b.attendanceStatus === "missed").length;

    return res.status(200).json({
      status: "success",
      data: {
        student,
        bookings,
        stats: { completed, missed, total: bookings.length }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};