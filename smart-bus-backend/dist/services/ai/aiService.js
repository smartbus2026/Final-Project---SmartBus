"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAiChat = handleAiChat;
require("@langchain/openai");
const universal_1 = require("langchain/chat_models/universal");
const messages_1 = require("@langchain/core/messages");
const langgraph_1 = require("@langchain/langgraph");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const systemPrompt_1 = require("./systemPrompt");
const tools_1 = require("./tools");
// ─── Singleton agent (shared across all requests) ─────────────────────────────
// MemorySaver stores conversation threads in-memory, keyed by thread_id.
// Each student gets their own thread, so memory is fully isolated per user.
const memorySaver = new langgraph_1.MemorySaver();
let agentInstance = null;
async function getAgent() {
    if (agentInstance)
        return agentInstance;
    require('dotenv').config();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY in environment variables. " +
            "Please add it to your .env file.");
    }
    // initChatModel resolves the model at runtime — easy to swap providers later.
    const llm = await (0, universal_1.initChatModel)("gpt-4o-mini", {
        modelProvider: "openai",
        temperature: 0.3,
        apiKey,
    });
    // Bind the tools so the LLM can call them
    agentInstance = createReactAgent({
        llm,
        tools: [tools_1.getBookingStatusTool, tools_1.getAvailableTripsTool, tools_1.bookTripTool, tools_1.getRegistrationWindowTool],
        checkpointSaver: memorySaver,
    });
    return agentInstance;
}
// ─── Public API ────────────────────────────────────────────────────────────────
/**
 * handleAiChat
 * ─────────────
 * Call this from your route handler. It is completely self-contained and does
 * NOT touch any existing controller or route file.
 *
 * @param userId  - MongoDB ObjectId string of the authenticated student.
 *                  Used as the LangGraph thread_id so each student has
 *                  isolated, persistent memory.
 * @param message - The raw text message sent by the student.
 * @returns       - The AI's reply as a plain string.
 */
async function handleAiChat(userId, message) {
    const agent = await getAgent();
    // Build the current-time context so the AI can evaluate registration windows
    const currentTime = new Date().toLocaleString('en-US', {
        timeZone: 'Africa/Cairo',
        hour12: true,
        hour: 'numeric',
        minute: 'numeric'
    });
    const currentDate = new Date().toLocaleString("en-EG", {
        timeZone: "Africa/Cairo",
        dateStyle: "full",
    });
    const systemWithTime = systemPrompt_1.SMARTBUS_SYSTEM_PROMPT.replace("{CURRENT_TIME}", currentTime) + `\n\nCurrent date (Cairo, EET): ${currentDate}`;
    // Inject userId into the system message so the tool always has it available
    const systemWithContext = `${systemWithTime}\n\nAuthenticated student userId: ${userId}`;
    const result = await agent.invoke({
        messages: [
            new messages_1.SystemMessage(systemWithContext),
            new messages_1.HumanMessage(message),
        ],
    }, {
        // thread_id isolates conversation history per student
        configurable: { thread_id: userId },
        // Stop the agent after 20 iterations to prevent infinite tool loops
        recursionLimit: 20,
    });
    // The agent returns an array of messages; the last one is the AI reply
    const messages = result.messages;
    const lastMessage = messages[messages.length - 1];
    if (typeof lastMessage.content === "string") {
        return lastMessage.content;
    }
    // Handle multi-part content (e.g. Gemini returns an array of parts)
    if (Array.isArray(lastMessage.content)) {
        return lastMessage.content
            .map((part) => (typeof part === "string" ? part : part.text ?? ""))
            .join("")
            .trim();
    }
    return "I'm sorry, I couldn't generate a response. Please try again.";
}
