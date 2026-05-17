"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const aiService_1 = require("../services/ai/aiService");
const router = (0, express_1.Router)();
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
router.post("/chat", authMiddleware_1.protect, async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
        res.status(400).json({ status: "error", message: "message field is required." });
        return;
    }
    const userId = req.user?._id?.toString();
    if (!userId) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
    }
    try {
        const reply = await (0, aiService_1.handleAiChat)(userId, message.trim());
        res.json({ status: "ok", reply });
    }
    catch (err) {
        console.error("[AI route error]", err.message);
        // Surface a friendly error — never leak stack traces to the client
        res.status(500).json({
            status: "error",
            message: err.message?.includes("OPENAI_API_KEY")
                ? "AI service is not configured. Please contact support."
                : "The AI assistant encountered an error. Please try again.",
        });
    }
});
exports.default = router;
