import express from "express";
import { createRoute, getAllRoutes, updateRoute, deleteRoute, addStopToRoute, removeStopFromRoute} from "../controllers/routeController";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
    


const router = express.Router();

router.get("/", protect, getAllRoutes);

router.post("/", protect, allowRoles("admin"), createRoute);
router.patch("/:id/add-stop", protect, allowRoles("admin"), addStopToRoute);
router.put("/:id", protect, allowRoles("admin"), updateRoute);
router.delete("/:id", protect, allowRoles("admin"), deleteRoute);

router.delete("/:id/remove-stop/:stopName", protect, allowRoles("admin"), removeStopFromRoute);


export default router;