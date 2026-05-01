"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const tripController_1 = require("../Controllers/tripController");
const router = express_1.default.Router();
// users
router.get("/", authMiddleware_1.protect, tripController_1.getTrips);
router.get("/:id", authMiddleware_1.protect, tripController_1.getTripById);
// admin only
router.post("/", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.createTrip);
router.put("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.updateTrip);
router.delete("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.deleteTrip);
// tracking
router.put("/:id/start", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.startTrip);
router.put("/:id/location", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.updateLocation);
router.put("/:id/end", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.endTrip);
exports.default = router;
