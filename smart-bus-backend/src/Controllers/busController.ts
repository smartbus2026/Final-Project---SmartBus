import { Request, Response } from "express";
import Bus from "../models/Bus";

export const createBus = async (req: Request, res: Response) => {
  try {
    const { busCode, driverName, capacity } = req.body;

    if (!busCode || !driverName) {
      return res.status(400).json({ message: "Bus Code and Driver Name are required." });
    }

    const newBus = await Bus.create({
      busCode,
      driverName,
      capacity: capacity || 45,
      isActive: true,
      currentLocation: { lat: 30.0444, lng: 31.2357 } // default location
    });

    res.status(201).json({ message: "Bus created successfully", bus: newBus });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "A bus with this Code already exists." });
    }
    res.status(500).json({ error: error.message });
  }
};
