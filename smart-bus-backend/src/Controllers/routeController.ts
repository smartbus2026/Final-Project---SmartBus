import { Request, Response } from "express";
import Route from "../models/Route";
import Stop from "../models/stop";

export const createRoute = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const existingRoute = await Route.findOne({ name });
    if (existingRoute) {
      return res.status(400).json({ 
        message: "Route with this name already exists!", 
        route: existingRoute 
      });
    }

    const newRoute = await Route.create(req.body);
    res.status(201).json(newRoute);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllRoutes = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = { name: { $regex: search, $options: "i" } };
    }

    const routes = await Route.find(query).populate("stops");
    res.status(200).json({
      results: routes.length,
      data: routes,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRoute = async (req: Request, res: Response) => {
  try {
    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedRoute);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Route deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const addStopToRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Route ID
    const { stop_name, lat, lng } = req.body;

    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({ message: "Route not found!" });
    }

    let stop = await Stop.findOne({ name: stop_name });

    if (!stop) {
      stop = await Stop.create({
        name: stop_name,
        location: { lat, lng },
      });
    }

    if (route.stops.includes(stop._id as any)) {
      return res.status(400).json({ message: "Stop already exists in this route" });
    }

    route.stops.push(stop._id as any);
    await route.save();

    const updatedRoute = await Route.findById(id).populate("stops");

    res.status(201).json({ 
      message: "Stop added to route successfully",
      route: updatedRoute, 
      stop 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const removeStopFromRoute = async (req: Request, res: Response) => {
  try {
    const { routeId, stopId } = req.params;
    const route = await Route.findById(routeId);
    
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    route.stops = route.stops.filter((id) => id.toString() !== stopId);
    await route.save();

    res.status(200).json({ message: "Stop removed from route", route });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};