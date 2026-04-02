import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = express.Router();

// admin only
router.get("/", protect, allowRoles("admin")); 

// user profile
router.get("/profile", protect);

export default router;