import { initChatModel } from "langchain/chat_models/universal";
import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
import { SMARTBUS_SYSTEM_PROMPT } from "./systemPrompt";
import { getAvailableTripsTool, getBookingStatusTool } from "./tools";

// ─── Singleton agent (shared across all requests) ─────────────────────────────
// MemorySaver stores conversation threads in-memory, keyed by thread_id.
// Each student gets their own thread, so memory is fully isolated per user.
const memorySaver = new MemorySaver();

let agentInstance: ReturnType<typeof createReactAgent> | null = null;

async function getAgent() {
  if (agentInstance) return agentInstance;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY in environment variables. " +
      "Please add it to your .env file."
    );
  }

  // initChatModel resolves the model at runtime — easy to swap providers later.
  const llm = await initChatModel("gpt-4o-mini", {
    modelProvider: "openai",
    temperature: 0.3,
    apiKey,
  });

  // Bind the tools so the LLM can call them
  agentInstance = createReactAgent({
    llm,
    tools: [getBookingStatusTool, getAvailableTripsTool],
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
export async function handleAiChat(userId: string, message: string): Promise<string> {
  const agent = await getAgent();

  // Build the current-time context so the AI can evaluate registration windows
  const nowEgypt = new Date().toLocaleString("en-EG", {
    timeZone: "Africa/Cairo",
    dateStyle: "full",
    timeStyle: "short",
  });

  const systemWithTime = `${SMARTBUS_SYSTEM_PROMPT}\n\nCurrent date/time (Cairo, EET): ${nowEgypt}`;

  // Inject userId into the system message so the tool always has it available
  const systemWithContext =
    `${systemWithTime}\n\nAuthenticated student userId: ${userId}`;

  const result = await agent.invoke(
    {
      messages: [
        new SystemMessage(systemWithContext),
        new HumanMessage(message),
      ],
    },
    {
      // thread_id isolates conversation history per student
      configurable: { thread_id: userId },
    }
  );

  // The agent returns an array of messages; the last one is the AI reply
  const messages: BaseMessage[] = result.messages;
  const lastMessage = messages[messages.length - 1];

  if (typeof lastMessage.content === "string") {
    return lastMessage.content;
  }

  // Handle multi-part content (e.g. Gemini returns an array of parts)
  if (Array.isArray(lastMessage.content)) {
    return lastMessage.content
      .map((part: any) => (typeof part === "string" ? part : part.text ?? ""))
      .join("")
      .trim();
  }

  return "I'm sorry, I couldn't generate a response. Please try again.";
}
