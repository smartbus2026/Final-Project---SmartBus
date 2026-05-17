import { Router, Request, Response } from "express";
import { protect } from "../middleware/authMiddleware";
import { handleAiChat } from "../services/ai/aiService";

const router = Router();

/**
 * POST /api/ai/chat
 * ─────────────────
 * Body  : { message: string }
 * Auth  : Bearer token (student must be logged in)
 * Returns: { reply: string }
 *
 * The authenticated user's MongoDB _id is used as the LangGraph thread_id,
 * giving each student completely isolated, persistent conversation memory.
 */
router.post("/chat", protect, async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ status: "error", message: "message field is required." });
    return;
  }

  const userId: string = (req as any).user?._id?.toString();
  if (!userId) {
    res.status(401).json({ status: "error", message: "Unauthorized." });
    return;
  }

  try {
    const reply = await handleAiChat(userId, message.trim());
    res.json({ status: "ok", reply });
  } catch (err: any) {
    console.error("[AI route error]", err.message);

    // Surface a friendly error — never leak stack traces to the client
    res.status(500).json({
      status: "error",
      message:
        err.message?.includes("OPENAI_API_KEY")
          ? "AI service is not configured. Please contact support."
          : "The AI assistant encountered an error. Please try again.",
    });
  }
});

export default router;
