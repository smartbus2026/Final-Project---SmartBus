import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (id: any, role: string) => {
  return jwt.sign(
    { id: id.toString(), role: role }, 
   process.env.JWT_SECRET as string, 
    { expiresIn: "30d" }
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, student_id, driver_id, role, phone_number } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Resolve the ID field: drivers send driver_id OR student_id (shared field in schema)
    const resolvedId = student_id || driver_id || undefined;

    const newUser = await User.create({
      name,
      email,
      password: hashed,
      student_id: resolvedId,
      role: role || "student",
      phone_number
    });

    return res.status(201).json({ 
      message: "User registered successfully",
      token: generateToken(newUser._id, newUser.role),
      user: { 
        id: newUser._id, 
        name: newUser.name, 
        role: newUser.role 
      }
    });

  } catch (err: any) {
    console.error("[register error]", err.message);
    // Mongoose validation / duplicate key errors produce a descriptive message
    return res.status(500).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      return res.json({
        token: generateToken(user._id, user.role),
        user: { id: user._id, name: user.name, role: user.role }
      });
    }
    return res.status(401).json({ message: "Invalid email or password" });
  } catch (err: any) {
    console.error("[login error]", err.message);
    return res.status(500).json({ message: err.message });
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