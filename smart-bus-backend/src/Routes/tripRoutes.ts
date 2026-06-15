import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

import {
  createTrip,
  getTrips,
  getTripById,
  getDriverTrips,
  updateTrip,
  deleteTrip,
  startTrip,
  updateLocation,
  endTrip,
  getMonthlyQuota,
  bulkDeleteTrips,
  getDriverHistory
} from "../Controllers/tripController";

const router = express.Router();

// All authenticated users
router.get("/", protect, getTrips);
router.get("/driver-trips", protect, allowRoles("driver"), getDriverTrips);
router.get("/my-history", protect, allowRoles("driver"), getDriverHistory);

// Admin only
router.get("/quota", protect, allowRoles("admin"), getMonthlyQuota);
router.get("/driver/:driverId/history", protect, allowRoles("admin"), getDriverHistory);

router.get("/:id", protect, getTripById);
router.post("/", protect, allowRoles("admin"), createTrip);
router.put("/:id", protect, allowRoles("admin"), updateTrip);
router.delete("/bulk", protect, allowRoles("admin"), bulkDeleteTrips);
router.delete("/:id", protect, allowRoles("admin"), deleteTrip);

// Driver or Admin can start/end a trip
router.patch("/:id/start", protect, allowRoles("admin", "driver"), startTrip);
router.patch("/:id/end", protect, allowRoles("admin", "driver"), endTrip);

// HTTP fallback for location update (admin only)
router.put("/:id/location", protect, allowRoles("admin"), updateLocation);

export default router;