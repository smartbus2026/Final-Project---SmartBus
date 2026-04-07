import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

import {createTrip,getTrips,getTripById,updateTrip, deleteTrip,startTrip,updateLocation,endTrip} from "../controllers/tripController";

const router = express.Router();

// users
router.get("/", protect, getTrips);
router.get("/:id", protect, getTripById);

// admin only
router.post("/", protect, allowRoles("admin"), createTrip);
router.put("/:id", protect, allowRoles("admin"), updateTrip);
router.delete("/:id", protect, allowRoles("admin"), deleteTrip);

// tracking
router.put("/:id/start", protect, allowRoles("admin"), startTrip);
router.put("/:id/location", protect, allowRoles("admin"), updateLocation);
router.put("/:id/end", protect, allowRoles("admin"), endTrip);

export default router;