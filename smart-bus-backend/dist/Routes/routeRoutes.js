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
// ── Specific / Multi-Segment Routes (Must be declared first) ──
router.patch("/:id/add-stop", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), routeController_1.addStopToRoute);
router.post("/:id/stops", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), routeController_1.addStopToRoute);
router.delete("/:routeId/remove-stop/:stopId", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), routeController_1.removeStopFromRoute);
// ── Generic / ID Routes (Must be declared last) ──
router.put("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), routeController_1.updateRoute);
router.delete("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), routeController_1.deleteRoute);
exports.default = router;
