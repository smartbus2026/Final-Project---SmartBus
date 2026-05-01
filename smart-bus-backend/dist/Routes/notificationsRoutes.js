"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const notificationController_1 = require("../Controllers/notificationController");
const router = express_1.default.Router();
router.get("/:userId", notificationController_1.getNotifications);
router.get("/unread/:userId", notificationController_1.getUnreadNotifications);
router.patch("/:id/read", notificationController_1.markAsRead);
router.delete("/:id", notificationController_1.deleteNotification);
router.post("/broadcast", authMiddleware_1.protect, notificationController_1.broadcastNotification);
exports.default = router;
