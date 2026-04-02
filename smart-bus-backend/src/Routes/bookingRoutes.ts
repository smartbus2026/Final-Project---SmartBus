import express from "express";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// student
router.post("/", protect);
router.get("/my", protect);
router.put("/:id/cancel", protect);

// admin
router.get("/", protect); 

export default router;