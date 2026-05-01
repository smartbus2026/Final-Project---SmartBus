import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { getDashboardStats } from "../Controllers/reportController";

const router = express.Router();

router.get("/dashboard-stats", protect, allowRoles("admin"), getDashboardStats);

export default router;
