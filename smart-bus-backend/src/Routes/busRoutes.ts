import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { createBus, getFleetQuota, getAllBuses } from "../Controllers/busController";

const router = express.Router();

router.get("/quota", protect, allowRoles("admin"), getFleetQuota);
router.get("/", protect, allowRoles("admin"), getAllBuses);
router.post("/", protect, allowRoles("admin"), createBus);

export default router;
