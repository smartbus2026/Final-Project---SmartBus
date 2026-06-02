import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { getDriverTrips } from "../Controllers/tripController";

const router = express.Router();

// GET /api/driver/trips strictly filtered by driver and today's date
router.get("/trips", protect, allowRoles("driver"), getDriverTrips);

export default router;
