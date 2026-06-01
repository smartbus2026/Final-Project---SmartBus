import express from "express";
import { createRoute, getAllRoutes, updateRoute, deleteRoute, addStopToRoute, removeStopFromRoute} from "../Controllers/routeController";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
    


const router = express.Router();

router.get("/", protect, getAllRoutes);
router.post("/", protect, allowRoles("admin"), createRoute);

// ── Specific / Multi-Segment Routes (Must be declared first) ──
router.patch("/:id/add-stop", protect, allowRoles("admin"), addStopToRoute);
router.post("/:id/stops", protect, allowRoles("admin"), addStopToRoute);
router.delete("/:routeId/remove-stop/:stopId", protect, allowRoles("admin"), removeStopFromRoute);

// ── Generic / ID Routes (Must be declared last) ──
router.put("/:id", protect, allowRoles("admin"), updateRoute);
router.delete("/:id", protect, allowRoles("admin"), deleteRoute);

export default router;