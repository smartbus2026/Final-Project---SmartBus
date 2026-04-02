import express from "express";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", protect);
router.put("/:id/read", protect);

export default router;