"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware"); // ضفنا دي عشان نحمي مسار الأدمن
const notificationController_1 = require("../Controllers/notificationController");
const router = express_1.default.Router();
// مسار الطالب أو الأدمن عشان يجيب اشعاراته
router.get("/", authMiddleware_1.protect, notificationController_1.getNotifications);
// مسار عشان يخلي الإشعار مقروء
router.put("/:id/read", authMiddleware_1.protect, notificationController_1.markAsRead);
// مسار الأدمن عشان يبعت اشعارات للكل (حطينا حماية الأدمن هنا)
router.post("/broadcast", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), notificationController_1.broadcastNotification);
exports.default = router;
