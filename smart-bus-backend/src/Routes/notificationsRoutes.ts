import express from "express";
import { protect } from "../middleware/authMiddleware";
// import { getNotifications,markAsRead } from "../controllers/notificationController";
import { getNotifications, markAsRead, broadcastNotification } from "../Controllers/notificationController";


const router = express.Router();


router.get("/", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);
router.post("/broadcast", protect, broadcastNotification);

export default router;