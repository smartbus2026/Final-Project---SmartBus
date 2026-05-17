import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { 
  createBooking, 
  getMyBookings, 
  getAllBookings, 
  cancelBooking,
  markAttendance,
  closeTrip,
  getBookingStats,
  getTodayBookings
} from "../controllers/bookingController";

const router = express.Router();

// ── Static Routes ──
router.post("/", protect, allowRoles("student"), createBooking);
router.get("/my", protect, allowRoles("student"), getMyBookings);
router.get("/stats", protect, allowRoles("admin"), getBookingStats);
router.get("/today", protect, allowRoles("admin"), getTodayBookings);
router.get("/", protect, allowRoles("admin"), getAllBookings);

// ── Semi-static (فيها /trip/ prefix) ──
router.patch("/trip/:id/close", protect, allowRoles("admin"), closeTrip); // ← اتنقلت لفوق

// ── Dynamic/ID Routes ──
router.put("/:id/cancel", protect, allowRoles("student", "admin"), cancelBooking);
router.patch("/:id/attend", protect, allowRoles("student", "admin"), markAttendance);

export default router;

