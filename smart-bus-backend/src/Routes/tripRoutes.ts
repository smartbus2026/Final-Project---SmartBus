import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

// users
router.get("/", protect);
router.get("/:id", protect);

// admin only
router.post("/", protect, allowRoles("admin"));
router.put("/:id", protect, allowRoles("admin"));
router.delete("/:id", protect, allowRoles("admin"));

// tracking
router.put("/:id/start", protect, allowRoles("admin"));
router.put("/:id/location", protect, allowRoles("admin"));
router.put("/:id/end", protect, allowRoles("admin"));

export default router;