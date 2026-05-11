"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const userController_1 = require("../Controllers/userController");
const router = express_1.default.Router();
router.get("/", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), userController_1.getAllUsers);
router.get("/profile", authMiddleware_1.protect, userController_1.getProfile);
router.put("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), userController_1.updateUser);
router.delete("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), userController_1.deleteUser);
exports.default = router;
