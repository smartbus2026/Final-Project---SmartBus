"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const chatController_1 = require("../Controllers/chatController");
const router = express_1.default.Router();
router.get("/:tripId", authMiddleware_1.protect, chatController_1.getMessages);
router.post("/:tripId", authMiddleware_1.protect, chatController_1.sendMessage);
exports.default = router;
