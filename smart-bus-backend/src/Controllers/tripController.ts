import { Request, Response } from "express";
import Trip from "../models/Trip";
import Route from "../models/Route";


// Create Trip (Admin)

export const createTrip = async (req: Request, res: Response) => {
  try {
    const { route_id, time_slot, departure_time, total_seats } = req.body;

    const route = await Route.findById(route_id);
    if (!route) return res.status(404).json({ message: "Route not found" });

    const trip = await Trip.create({
      route: route_id,
      date: departure_time,
      time_slot, 
      total_seats
    });
    res.status(201).json(trip);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



//  Get All Trips
export const getTrips = async (req: Request, res: Response) => {
  try {
    const trips = await Trip.find().populate("route");

    res.json({
      results: trips.length,
      data: trips
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



//    Get Single Trip

export const getTripById = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id).populate("route");

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json(trip);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



//    Update Trip (Admin)

export const updateTrip = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json(trip);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



//    Delete Trip (Admin)

export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json({ message: "Trip deleted successfully" });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



//    Start Trip (Admin)

export const startTrip = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    trip.status = "active";
    await trip.save();
    res.json({ message: "Trip started", trip });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



//    Update Live Location (Tracking)

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    trip.current_location= {
      lat,
      lng,
      last_updated: new Date()
    };

    await trip.save();

    res.json({ message: "Location updated", trip });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



//    End Trip

export const endTrip = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    trip.status = "completed";
    await trip.save();

    res.json({ message: "Trip ended", trip });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};