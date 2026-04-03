import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { generateToken } from "../middleware/generateToken";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // check email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // generate token
    const token = generateToken(user._id.toString(), user.role);

    res.json({
      message: "Login success",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};