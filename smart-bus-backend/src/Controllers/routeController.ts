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

// 2.(Read)
export const getAllRoutes = async (req: Request, res: Response) => {
  try {
    const routes = await Route.find();
    res.json(routes);
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