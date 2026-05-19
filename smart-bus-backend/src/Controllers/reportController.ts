import { Request, Response } from "express";
import User from "../models/User";
import Trip from "../models/Trip";
import Booking from "../models/Booking.model";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalTrips,
      activeTrips,
      totalBookings,
      utilizationData,
      recentActivity
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Trip.countDocuments(),
      Trip.countDocuments({ status: { $in: ["active", "scheduled"] } }),
      Booking.countDocuments({ status: { $in: ["active", "pending", "completed"] } }),
      Trip.aggregate([
        {
          $group: {
            _id: null,
            totalBooked: { $sum: "$booked_seats" },
            totalSeats: { $sum: "$total_seats" }
          }
        }
      ]),
      Booking.find({ status: { $in: ["active", "pending", "completed"] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email")
        .populate("route", "name")
    ]);

    let utilizationRate = 0;
    if (utilizationData.length > 0 && utilizationData[0].totalSeats > 0) {
      utilizationRate = Math.round(
        (utilizationData[0].totalBooked / utilizationData[0].totalSeats) * 100
      );
    }

    res.json({
      totalUsers,
      totalTrips,
      activeTrips,
      totalBookings,
      utilizationRate,
      recentActivity
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ── Attendance Report with optional filters ─────────────────────────────────
export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { date, routeId, busId, timeSlot, specificReturnTime } = req.query;

    const query: any = {
      attendanceStatus: { $in: ["completed", "missed"] }
    };

    // Date filter: match full day range
    if (date) {
      const dayStart = new Date(date as string);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date as string);
      dayEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dayStart, $lte: dayEnd };
    }

    if (routeId)  query.route  = routeId;
    if (busId)    query.busId  = busId;
    if (timeSlot) query.timeSlot = timeSlot;
    if (timeSlot === "Return" && specificReturnTime) {
      query.specificReturnTime = specificReturnTime;
    }

    const bookings = await Booking.find(query)
      .populate("user", "name email")
      .populate("route", "name")
      .populate("busId", "busCode")
      .sort({ date: -1 });

    const completed = bookings.filter((b: any) => b.attendanceStatus === "completed").length;
    const missed    = bookings.filter((b: any) => b.attendanceStatus === "missed").length;
    const total     = bookings.length;
    const rate      = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.status(200).json({
      status: "success",
      data: {
        bookings,
        stats: { completed, missed, total, rate }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
