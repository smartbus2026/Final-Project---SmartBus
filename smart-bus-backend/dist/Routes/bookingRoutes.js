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
// ── Static Routes ──
router.post("/", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("student"), bookingController_1.createBooking);
router.get("/my", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("student"), bookingController_1.getMyBookings);
router.get("/stats", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), bookingController_1.getBookingStats);
router.get("/today", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), bookingController_1.getTodayBookings);
router.get("/admin/demand", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), bookingController_1.getDemandAggregation);
router.get("/admin/assigned-trips", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), bookingController_1.getAssignedTrips);
router.post("/admin/dispatch", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), bookingController_1.dispatchBus);
router.post("/admin/recover", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), bookingController_1.recoverCancelledBookings);
router.get("/", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), bookingController_1.getAllBookings);
// ── Semi-static ──
router.patch("/trip/:id/close", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), bookingController_1.closeTrip);
// ── Dynamic/ID Routes ──
router.put("/:id/cancel", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("student", "admin"), bookingController_1.cancelBooking);
router.patch("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("student"), bookingController_1.updateBooking);
router.patch("/:id/attendance", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("student", "admin"), bookingController_1.markAttendanceStatus);
exports.default = router;
