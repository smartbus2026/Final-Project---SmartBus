import express from "express";
import { createRoute, getAllRoutes, updateRoute, deleteRoute } from "../controllers/routeController";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/", protect, getAllRoutes);

router.post("/", protect, allowRoles("admin"), createRoute);
router.put("/:id", protect, allowRoles("admin"), updateRoute);
router.delete("/:id", protect, allowRoles("admin"), deleteRoute);

export default router;