"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const settingsController_1 = require("../Controllers/settingsController");
const router = express_1.default.Router();
router.get("/", authMiddleware_1.protect, settingsController_1.getSettings);
router.put("/", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), settingsController_1.updateSettings);
exports.default = router;
