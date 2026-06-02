import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import User from "../models/User";
import { getSystemSettings, updateSystemSettings } from "../Controllers/settingsController";

const router = express.Router();

// GET /api/admin/drivers
// Queries User collection for role: 'driver' and returns only _id and name
router.get("/drivers", protect, allowRoles("admin"), async (req, res) => {
  try {
    const drivers = await User.find({ role: "driver" }).select("_id name");
    res.status(200).json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/settings", protect, allowRoles("admin"), getSystemSettings);
router.put("/settings", protect, allowRoles("admin"), updateSystemSettings);

export default router;
