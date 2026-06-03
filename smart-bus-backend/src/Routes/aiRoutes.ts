import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { handleAiChat } from "../Controllers/aiController";

const router = Router();

/**
 * POST /api/ai/chat
 * ─────────────────
 * Body  : { message: string }
 * Auth  : Bearer token (student or admin must be logged in)
 * Returns: { reply: string }
 */
router.post("/chat", protect, handleAiChat);

export default router;
