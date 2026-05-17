import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  updateBooking,
  markAttendanceStatus,
  closeTrip,
  getBookingStats,
  getTodayBookings,
  getDemandAggregation,
  dispatchBus,
  recoverCancelledBookings,
  getAssignedTrips
} from "../Controllers/bookingController";

const router = express.Router();

// ── Static Routes ──
router.post("/", protect, allowRoles("student"), createBooking);
router.get("/my", protect, allowRoles("student"), getMyBookings);
router.get("/stats", protect, allowRoles("admin"), getBookingStats);
router.get("/today", protect, allowRoles("admin"), getTodayBookings);
router.get("/admin/demand", protect, allowRoles("admin"), getDemandAggregation);
router.get("/admin/assigned-trips", protect, allowRoles("admin"), getAssignedTrips);
router.post("/admin/dispatch", protect, allowRoles("admin"), dispatchBus);
router.post("/admin/recover", protect, allowRoles("admin"), recoverCancelledBookings);
router.get("/", protect, allowRoles("admin"), getAllBookings);

// ── Semi-static ──
router.patch("/trip/:id/close", protect, allowRoles("admin"), closeTrip);

// ── Dynamic/ID Routes ──
router.put("/:id/cancel", protect, allowRoles("student", "admin"), cancelBooking);
router.patch("/:id", protect, allowRoles("student"), updateBooking);
router.patch("/:id/attendance", protect, allowRoles("student", "admin"), markAttendanceStatus);

export default router;
