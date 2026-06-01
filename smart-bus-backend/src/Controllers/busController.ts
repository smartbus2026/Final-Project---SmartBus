import { Request, Response } from "express";
import Bus from "../models/Bus";

export const createBus = async (req: Request, res: Response) => {
  try {
    const { busCode, driver, capacity } = req.body;

    if (!busCode || !driver) {
      return res.status(400).json({ message: "Bus Code and Driver are required." });
    }

    const newBus = await Bus.create({
      busCode,
      driver,
      capacity: capacity || 45,
      isActive: true,
      currentLocation: { lat: 30.0444, lng: 31.2357 }
    });

    res.status(201).json({ message: "Bus created successfully", bus: newBus });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "A bus with this Code already exists." });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getFleetQuota = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const Booking = (await import("../models/Booking.model")).default;

    // Count distinct dispatch events: each unique (busId + date + timeSlot) group
    // within the current month where a bus was actively assigned.
    const distinctDispatches = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["assigned", "active", "completed"] },
          busId: { $exists: true, $ne: null },
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: {
            busId: "$busId",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            timeSlot: "$timeSlot"
          }
        }
      },
      { $count: "total" }
    ]);

    const usedCapacity = distinctDispatches[0]?.total || 0;

    return res.status(200).json({ usedCapacity, totalCapacity: 308 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllBuses = async (req: Request, res: Response) => {
  try {
    const buses = await Bus.find({}).populate("driver", "name email");
    res.status(200).json({ results: buses.length, data: buses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
