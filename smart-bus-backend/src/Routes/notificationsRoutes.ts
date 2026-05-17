import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware"; // ضفنا دي عشان نحمي مسار الأدمن
import { getNotifications, markAsRead, broadcastNotification } from "../controllers/notificationController";

const router = express.Router();

// مسار الطالب أو الأدمن عشان يجيب اشعاراته
router.get("/", protect, getNotifications);

// مسار عشان يخلي الإشعار مقروء
router.patch("/:id/read", protect, markAsRead);

// مسار الأدمن عشان يبعت اشعارات للكل (حطينا حماية الأدمن هنا)
router.post("/broadcast", protect, allowRoles("admin"), broadcastNotification);

export default router;