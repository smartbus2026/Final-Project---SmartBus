import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicketStatus,
} from "../Controllers/supportController";

const router = express.Router();

// Student routes
router.post("/",    protect, allowRoles("student"),         createTicket);
router.get("/my",   protect, allowRoles("student"),         getMyTickets);

// Admin routes
router.get("/",     protect, allowRoles("admin"),           getAllTickets);
router.put("/:id",  protect, allowRoles("admin"),           updateTicketStatus);

export default router;
