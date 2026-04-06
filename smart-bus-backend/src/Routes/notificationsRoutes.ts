import express from "express";
import { protect } from "../middleware/authMiddleware";
import { getNotifications,markAsRead } from "../Controllers/notificationController";


const router = express.Router();


router.get("/", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);

export default router;