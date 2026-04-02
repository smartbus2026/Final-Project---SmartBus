import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

// public 
router.get("/", protect);

// admin only
router.post("/", protect, allowRoles("admin"));
router.put("/:id", protect, allowRoles("admin"));
router.delete("/:id", protect, allowRoles("admin"));

export default router;