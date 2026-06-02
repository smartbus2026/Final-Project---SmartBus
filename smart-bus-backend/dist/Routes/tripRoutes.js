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
// All authenticated users
router.get("/", authMiddleware_1.protect, tripController_1.getTrips);
router.get("/driver-trips", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("driver"), tripController_1.getDriverTrips);
// Admin only
router.get("/quota", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.getMonthlyQuota);
router.get("/:id", authMiddleware_1.protect, tripController_1.getTripById);
router.post("/", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.createTrip);
router.put("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.updateTrip);
router.delete("/bulk", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.bulkDeleteTrips);
router.delete("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.deleteTrip);
// Driver or Admin can start/end a trip
router.patch("/:id/start", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin", "driver"), tripController_1.startTrip);
router.patch("/:id/end", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin", "driver"), tripController_1.endTrip);
// HTTP fallback for location update (admin only)
router.put("/:id/location", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), tripController_1.updateLocation);
exports.default = router;
