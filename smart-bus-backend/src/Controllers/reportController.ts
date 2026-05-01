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
      Booking.countDocuments({ status: "active" }),
      Trip.aggregate([
        {
          $group: {
            _id: null,
            totalBooked: { $sum: "$booked_seats" },
            totalSeats: { $sum: "$total_seats" }
          }
        }
      ]),
      Booking.find({ status: "active" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email")
        .populate({
          path: "trip",
          populate: { path: "route", select: "name" }
        })
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
