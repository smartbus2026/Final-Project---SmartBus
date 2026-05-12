import { Request, Response } from "express";
import Settings from "../models/Settings.model";

// جيب الإعدادات الحالية
export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        booking_open_hour: 20,
        booking_open_minute: 0,
        booking_close_hour: 23,
        booking_close_minute: 0,
      });
    }
    res.status(200).json({ status: "success", data: { settings } });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

// الأدمن يعدل الإعدادات
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { booking_open_hour, booking_open_minute, booking_close_hour, booking_close_minute } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ booking_open_hour, booking_open_minute, booking_close_hour, booking_close_minute });
    } else {
      settings.booking_open_hour    = booking_open_hour    ?? settings.booking_open_hour;
      settings.booking_open_minute  = booking_open_minute  ?? settings.booking_open_minute;
      settings.booking_close_hour   = booking_close_hour   ?? settings.booking_close_hour;
      settings.booking_close_minute = booking_close_minute ?? settings.booking_close_minute;
      await settings.save();
    }

    res.status(200).json({ status: "success", data: { settings } });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};