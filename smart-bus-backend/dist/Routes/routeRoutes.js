"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routeController_1 = require("../Controllers/routeController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = express_1.default.Router();
router.get("/", authMiddleware_1.protect, routeController_1.getAllRoutes);
router.post("/", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), routeController_1.createRoute);
router.patch("/:id/add-stop", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), routeController_1.addStopToRoute);
router.post("/:id/stops", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), routeController_1.addStopToRoute);
router.put("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), routeController_1.updateRoute);
router.delete("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), routeController_1.deleteRoute);
router.delete("/:id/remove-stop/:stopId", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), routeController_1.removeStopFromRoute);
exports.default = router;
