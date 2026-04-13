import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { 
  createBooking, 
  getMyBookings, 
  getAllBookings, 
  cancelBooking 
} from "../Controllers/bookingController";

const router = express.Router();

// Student Routes
router.post("/", protect, allowRoles("student"), createBooking);
router.get("/my", protect, allowRoles("student"), getMyBookings);
router.put("/:id/cancel", protect, allowRoles("student"), cancelBooking);

// Admin Routes
router.get("/", protect, allowRoles("admin"), getAllBookings);

export default router;