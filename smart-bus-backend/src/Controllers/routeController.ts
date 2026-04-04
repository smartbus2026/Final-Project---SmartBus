import { Request, Response } from "express";
import Route from "../models/Route";

// 1. (Create)
export const createRoute = async (req: Request, res: Response) => {
  try {
    const newRoute = await Route.create(req.body);
    res.status(201).json(newRoute);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 2.(Read) and search
export const getAllRoutes = async (req: Request, res: Response) => {
  try {
    const { search } = req.query; 
    let query = {};

    if (search) {
      query = { route_name: { $regex: search, $options: "i" } };
    }

    const routes = await Route.find(query);
    res.status(200).json({
      results: routes.length,
      data: routes
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 3. (Update)
export const updateRoute = async (req: Request, res: Response) => {
  try {
    const updatedRoute = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedRoute);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 4. (Delete)
export const deleteRoute = async (req: Request, res: Response) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.json({ message: "Route deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// (Add Stop to Route)
export const addStopToRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stop_name, lat, lng } = req.body;

    const route = await Route.findById(id);
    
    if (!route) {
      return res.status(404).json({ message: "Route not found! " });
    }

    const stopExists = route.stops.find(
      s => s.stop_name.toLowerCase() === stop_name.toLowerCase()
    );

    if (stopExists) {
      return res.status(400).json({ message: "This point is already present in this path" });
    }

    route.stops.push({ stop_name, lat, lng });
    await route.save(); 

    res.status(200).json(route);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// (Remove Stop from Route)
export const removeStopFromRoute = async (req: Request, res: Response) => {
  try {
    const { id, stopName } = req.params;

    const updatedRoute = await Route.findByIdAndUpdate(
      id,
      { $pull: { stops: { stop_name: stopName } } }, 
      { new: true }
    );

    res.status(200).json(updatedRoute);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};