import { Request, Response } from "express";
import { handleAiChat } from "../services/ai/aiService";

/**
 * aiController.ts
 * ─────────────────
 * Slim HTTP wrapper. All AI/LangChain logic lives in aiService.ts.
 * Responsibilities: validate input, authenticate user, delegate, respond.
 */
export const handleAiChatController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Validate incoming message
    const { message } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      res
        .status(400)
        .json({ status: "error", message: "message field is required." });
      return;
    }

    // 2. Authenticate user (populated by auth middleware)
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ status: "error", message: "Unauthorized." });
      return;
    }

    // 3. Extract identity
    const userId: string = String(user._id || user.id);
    const userRole: string = user.role ?? "student";

    // 4. Delegate all business logic to the AI service
    const reply = await handleAiChat(userId, userRole, message);

    // 5. Return the sanitised response
    res.json({ status: "ok", reply });
  } catch (err: any) {
    console.error("[AI Chat Controller Error]:", err);
    res.status(500).json({
      status: "error",
      message: err.message?.includes("OPENAI_API_KEY")
        ? "AI service is not configured. Please contact support."
        : "The AI assistant encountered an error. Please try again.",
    });
  }
};

// Keep backward-compatible named export used by existing routes
export { handleAiChatController as handleAiChat };
