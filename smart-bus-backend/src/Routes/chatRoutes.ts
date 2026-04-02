import express from "express";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", protect);
router.get("/", protect);

export default router;