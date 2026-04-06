import { Request, Response } from "express";
import User from "../models/User";

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