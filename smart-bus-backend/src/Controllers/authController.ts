import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (id: any) => {
  return jwt.sign({ id: id.toString() }, process.env.JWT_SECRET || "secret", {
    expiresIn: "30d",
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, student_id, role, phone_number } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashed,
      student_id,
      role: role || "student",
      phone_number
    });

    return res.status(201).json({ 
      message: "User registered",
      token: generateToken(newUser._id) 
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      return res.json({
        token: generateToken(user._id),
        user: { id: user._id, name: user.name, role: user.role }
      });
    }
    return res.status(401).json({ message: "Invalid email or password" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password"); 
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};