"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const bookingController_1 = require("../Controllers/bookingController");
const router = express_1.default.Router();
// Student Routes
router.post("/", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("student"), bookingController_1.createBooking);
router.get("/my", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("student"), bookingController_1.getMyBookings);
router.put("/:id/cancel", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("student"), bookingController_1.cancelBooking);
// Admin Routes
router.get("/", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), bookingController_1.getAllBookings);
exports.default = router;
