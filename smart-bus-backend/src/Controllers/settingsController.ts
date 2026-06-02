import { Request, Response } from "express";
import Settings from "../models/Settings.model";
import SystemSettings from "../models/SystemSettings.model";

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
        returnTimeOptions: ["3:30 PM", "7:00 PM"],
        morningStartTime: "08:30 AM"
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
    const { booking_open_hour, booking_open_minute, booking_close_hour, booking_close_minute, returnTimeOptions, morningStartTime } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ booking_open_hour, booking_open_minute, booking_close_hour, booking_close_minute, returnTimeOptions, morningStartTime });
    } else {
      settings.booking_open_hour    = booking_open_hour    ?? settings.booking_open_hour;
      settings.booking_open_minute  = booking_open_minute  ?? settings.booking_open_minute;
      settings.booking_close_hour   = booking_close_hour   ?? settings.booking_close_hour;
      settings.booking_close_minute = booking_close_minute ?? settings.booking_close_minute;
      if (returnTimeOptions !== undefined) {
        settings.returnTimeOptions = returnTimeOptions;
      }
      if (morningStartTime !== undefined) {
        settings.morningStartTime = morningStartTime;
      }
      await settings.save();
    }

    res.status(200).json({ status: "success", data: { settings } });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
};

// GET /api/admin/settings
// Fetch the system settings document (creates one with defaults if missing).
export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    return res.status(200).json({ status: "success", data: { settings } });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
};

// PUT /api/admin/settings
// Update defaultShiftLimit and monthlyBusQuota.
export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const defaultShiftLimitRaw = req.body?.defaultShiftLimit;
    const monthlyBusQuotaRaw = req.body?.monthlyBusQuota;

    const defaultShiftLimit =
      defaultShiftLimitRaw === undefined ? undefined : Number(defaultShiftLimitRaw);
    const monthlyBusQuota =
      monthlyBusQuotaRaw === undefined ? undefined : Number(monthlyBusQuotaRaw);

    if (defaultShiftLimit !== undefined) {
      if (!Number.isFinite(defaultShiftLimit) || defaultShiftLimit < 1) {
        return res.status(400).json({
          status: "error",
          message: "defaultShiftLimit must be a number >= 1"
        });
      }
    }

    if (monthlyBusQuota !== undefined) {
      if (!Number.isFinite(monthlyBusQuota) || monthlyBusQuota < 1) {
        return res.status(400).json({
          status: "error",
          message: "monthlyBusQuota must be a number >= 1"
        });
      }
    }

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({ defaultShiftLimit, monthlyBusQuota });
    } else {
      settings.defaultShiftLimit = defaultShiftLimit ?? settings.defaultShiftLimit;
      settings.monthlyBusQuota = monthlyBusQuota ?? settings.monthlyBusQuota;
      await settings.save();
    }

    return res.status(200).json({ status: "success", data: { settings } });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
};