import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { getDashboardStats, getAttendanceReport } from "../Controllers/reportController";

const router = express.Router();

router.get("/dashboard-stats", protect, allowRoles("admin"), getDashboardStats);
router.get("/attendance",      protect, allowRoles("admin"), getAttendanceReport);

export default router;
