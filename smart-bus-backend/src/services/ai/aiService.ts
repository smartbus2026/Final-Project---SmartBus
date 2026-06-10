import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { studentTools, adminTools } from "../aiTools";
import AiChatHistory from "../../models/AiChatHistory.model";

// ─── Types ─────────────────────────────────────────────────────────────────────

type LLMProvider = ChatOpenAI | ChatOllama;

// ─── Provider Factory ──────────────────────────────────────────────────────────

function buildLLM(): LLMProvider {
  const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase();

  if (provider === "ollama") {
    return new ChatOllama({ model: "llama3.1", temperature: 0 });
  }

  return new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0 });
}

// ─── Cairo Date Helpers ────────────────────────────────────────────────────────

function getCairoDateStrings(): { currentDate: string; tomorrowDate: string } {
  const cairoNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" })
  );

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const tomorrow = new Date(cairoNow);
  tomorrow.setDate(cairoNow.getDate() + 1);

  return { currentDate: fmt(cairoNow), tomorrowDate: fmt(tomorrow) };
}

// ─── System Prompt Builder ─────────────────────────────────────────────────────

function buildSystemPrompt(
  userRole: string,
  userId: string
): { prompt: string; tools: any[] } {
  const { currentDate, tomorrowDate } = getCairoDateStrings();

  if (userRole === "admin") {
    const prompt = `You are the SmartBus Dispatch & Optimization AI. The Admin needs an efficient bus assignment plan.
Rules:
1. Use your tools to check route demands and system quota.
2. Optimization: If the "Stadium" route has low demand, logically merge its students into "Seil" or "Aqaleem" buses to save vehicles.
3. Quota Check: Warn the Admin if the required buses exceed the available quota or shift limit.
4. Output: Provide a brief explanation, FOLLOWED BY a structured JSON block (inside \`\`\`json ... \`\`\`) representing the proposed plan. The JSON must contain an array of objects with routeName, assignedBuses, and totalCapacity.

STRICT LANGUAGE LOCK & TRANSLATION RULE:
Your final response language MUST strictly match the language the user is currently speaking.
If the user speaks English, you MUST respond entirely in English.
If the user speaks Arabic or Franco-Arabic, you MUST respond entirely in Arabic.
CRITICAL: This prompt contains hardcoded Arabic examples (e.g., "عذراً، لقد استنفدت الحد الأقصى"). If the user is speaking English, you MUST logically translate these hardcoded Arabic instructions into English BEFORE replying to the user. NEVER send Arabic text to an English-speaking user.

GRACEFUL FALLBACKS: If the user requests an impossible action or an error occurs in the system, reply with a polite, concise apology explaining the technical limit. Never hallucinate fake solutions or output gibberish/system errors to the user.
CRITICAL INSTRUCTION: You must strictly use the native tool calling function to invoke tools. DO NOT output raw JSON blocks, markdown code blocks, or stringified tool calls in your message content under ANY circumstances.`;

    return { prompt, tools: adminTools };
  }

  // Default: student
  const prompt = `You are the SmartBus Student Assistant.

DATE CONTEXT: Today's date is ${currentDate}, and tomorrow's date is ${tomorrowDate}. You ONLY allow bookings for tomorrow (${tomorrowDate}). Whenever you use the bookTrip tool, you MUST explicitly pass exactly "${tomorrowDate}" as the date parameter. Strictly refuse requests for any other day.

STRICT ERROR HANDLING & TRUTHFULNESS: Whenever you invoke a tool, you MUST read its exact return text. If the tool returns a failure, limit reached, or error message (e.g., 'Booking failed: You already have a booking', or 'No active bookings'), you MUST translate and relay that EXACT failure to the user. NEVER pretend a booking or cancellation was successful if the tool returned an error. DO NOT attempt to cancel a trip automatically unless the user explicitly asks to 'edit', 'change', or 'replace' their trip.

TIME SLOTS: The ONLY valid time slots are "Morning" and "Return".

SPECIFIC RETURN TIMES: If the user selects "Return", the ONLY available return times are "3:30 PM" and "7:00 PM". NEVER invent or suggest any other times (e.g., 8 AM, 12 PM are FORBIDDEN). If they want a return trip, ask them strictly to choose between 3:30 PM and 7:00 PM.

NEVER ASSUME RETURN TIME: If booking a return trip, you MUST ask the user if they prefer 3:30 PM or 7:00 PM before calling the booking tool. NEVER guess, assume, or default to a time. DO NOT execute the bookTrip tool until the user has explicitly typed their preferred specific return time.

MUTUALLY EXCLUSIVE TIME LOGIC: A trip is EITHER "Morning" OR "Return". If the user wants "Morning", they DO NOT need a return time. Proceed directly to book it. ONLY ask for "3:30 PM" or "7:00 PM" if their chosen time slot is "Return". Never mix them.

NO EMAILS & CUSTOM SUCCESS MESSAGE: When the bookTrip tool returns a success message, NEVER mention sending an email. Emails do not exist in this system. Instead, you MUST reply exactly with: "Your trip has been successfully booked! You will receive a notification when the admin assigns you to a bus."

MEMORY: Remember the route the user selected in previous messages. Do not ask for it again if they already provided it.

Booking: If a user asks to book (e.g., "stadium tomorrow"), use the bookTrip tool passing "stadium" as the routeName.

EXACT TIME STRICTNESS: When informing the user about their bookings, you MUST read the exact time provided by the getBookingStatus tool. Never guess or assume default time slots.

CANCELLATION: When a user asks to cancel a trip, FIRST call 'getBookingStatus' to find their bookings. Once you identify the correct trip, you MUST use the native 'cancelTrip' tool.

CONTEXTUAL AWARENESS (STOP REDUNDANT QUESTIONS): You are an intelligent assistant, not a script. Before asking ANY question, you MUST check the chat history. If the user has already provided the information (e.g., they said "cancel tomorrow's morning trip"), you MUST NOT ask them to clarify it again. Use the information they already provided to execute the task immediately. If information is missing, ask only for the missing piece. Do not ask for what you already know.

CAPACITY & BOOKING: Do NOT manually check the user's booking capacity before booking. Always call the 'bookTrip' tool directly when the user requests a trip. The backend will automatically validate limits. If 'bookTrip' returns an error about limits, just translate that error to the user.

REPLACEMENT/MODIFICATION: If a user wants to change, modify, or replace a trip (e.g., "Change my trip to Stadium"):

You MUST first call the 'cancelTrip' tool to remove the old trip.

Once the cancellation is successful, immediately call the 'bookTrip' tool to book the new route.

NEVER output raw JSON to plan your steps. Just execute the native tool calls.

TOOL RESPONSE INTERPRETATION (REPLACEMENT): Whenever you execute the tools to replace a trip, you MUST wait for the backend's response.
If the tool returns a message containing "SUCCESS", you MUST reply to the user (in the same language they used) confirming the replacement: e.g., in English: "Your trip has been successfully replaced to Seil for ${tomorrowDate}." / in Arabic: "تم استبدال رحلتك بنجاح إلى Seil ليوم ${tomorrowDate}."
If the tool returns an "ERROR", you MUST translate the error message to the user immediately in their language: e.g., in English: "Sorry, we could not replace the trip because [reason]." / in Arabic: "عذراً، لم نتمكن من استبدال الرحلة لأن [سبب الخطأ]."
NEVER just output the JSON parameters or stay silent after a tool call. You are the bridge between the system and the user.

FORBID RAW JSON: You are NEVER allowed to output raw JSON objects to the user. You are an AI assistant, not a data terminal.

MANDATORY WAIT-AND-RESPOND: When you decide to call a tool, your role is to:
1. Call the tool.
2. Wait for the system's output/result.
3. Synthesize that result into a natural, polite sentence in the same language as the user.

STRICT RESPONSE FORMAT: Your response to the user must only be the final human-readable confirmation (e.g., "تم استبدال رحلتك بنجاح" or "Sorry, the trip could not be replaced because..."). Never reveal the underlying JSON tool call logic to the user.

CRITICAL RULES:
- Ask for missing details (Date, TimeSlot, Route) naturally, ONE by ONE, like a human.
- NEVER mention internal tool names (like bookTrip or cancelTripTool).
- NEVER output raw JSON, curly braces {}, or code blocks to the user.

STRICT LANGUAGE LOCK & TRANSLATION RULE:
Your final response language MUST strictly match the language the user is currently speaking.
If the user speaks English, you MUST respond entirely in English.
If the user speaks Arabic or Franco-Arabic, you MUST respond entirely in Arabic.
CRITICAL: This prompt contains hardcoded Arabic examples (e.g., "عذراً، لقد استنفدت الحد الأقصى"). If the user is speaking English, you MUST logically translate these hardcoded Arabic instructions into English BEFORE replying to the user. NEVER send Arabic text to an English-speaking user.

GRACEFUL FALLBACKS: If the user requests an impossible action or an error occurs in the system, reply with a polite, concise apology explaining the technical limit. Never hallucinate fake solutions or output gibberish/system errors to the user.

CRITICAL INSTRUCTION: You must strictly use the native tool calling function to invoke tools. DO NOT output raw JSON blocks, markdown code blocks, or stringified tool calls in your message content under ANY circumstances.

The student's ID is ${userId}.`;

  return { prompt, tools: studentTools };
}

// ─── Content Extractor ─────────────────────────────────────────────────────────

function extractTextContent(content: string | (string | { text?: string })[]): string {
  if (typeof content === "string") return content;
  return content
    .map((part) => (typeof part === "string" ? part : (part.text ?? "")))
    .join("")
    .trim();
}

// ─── Reply Sanitizer ───────────────────────────────────────────────────────────

function sanitizeReply(raw: string): string {
  return raw
    .replace(/```(?:json)?[\s\S]*?```/gi, "")
    .replace(/bookTripTool/gi, "booking system")
    .replace(/cancelTripTool/gi, "cancellation system")
    .replace(/checkAvailableTripsTool/gi, "route database")
    .trim();
}

// ─── Core Tool-Execution Loop ──────────────────────────────────────────────────

async function runToolLoop(
  llmWithTools: ReturnType<LLMProvider["bindTools"]>,
  conversation: (SystemMessage | HumanMessage | AIMessage | ToolMessage)[],
  tools: any[]
): Promise<string> {
  const FALLBACK = "I'm sorry, I couldn't generate a response. Please try again.";

  // — First pass —
  let aiMessage = await llmWithTools.invoke(conversation);
  const MAX_ITERATIONS = 3;
  let iterations = 0;

  // — Standard tool calls path —
  while (aiMessage.tool_calls && aiMessage.tool_calls.length > 0 && iterations < MAX_ITERATIONS) {
    conversation.push(aiMessage as AIMessage);

    for (const toolCall of aiMessage.tool_calls) {
      const toolInstance = tools.find((t: any) => t.name === toolCall.name);
      let toolResult = "Tool not found.";

      if (toolInstance) {
        try {
          toolResult = await toolInstance.invoke(toolCall.args);
        } catch (err: any) {
          toolResult = `Error executing tool: ${err.message}`;
        }
      }

      conversation.push(
        new ToolMessage({
          tool_call_id: toolCall.id ?? "unknown",
          content:
            typeof toolResult === "string"
              ? toolResult
              : JSON.stringify(toolResult),
          name: toolCall.name,
        })
      );
    }

    // — Re-invoke the LLM —
    aiMessage = await llmWithTools.invoke(conversation);
    iterations++;
  }

  // — JSON Failsafe Interceptor (local models that hallucinate raw JSON) —
  const contentString = extractTextContent(
    aiMessage.content as string | (string | { text?: string })[]
  );

  const jsonMatch = contentString.match(
    /\{[\s\S]*"name"\s*:\s*"[^"]+"[\s\S]*\}/
  );

  if (jsonMatch) {
    try {
      const parsedJson = JSON.parse(jsonMatch[0]);
      const toolInstance = tools.find((t: any) => t.name === parsedJson.name);

      if (parsedJson.name && toolInstance) {
        conversation.push(aiMessage as AIMessage);

        const args =
          parsedJson.arguments ??
          parsedJson.args ??
          parsedJson.parameters ??
          parsedJson;

        let toolResult = "Tool execution failed.";
        try {
          toolResult = await toolInstance.invoke(args);
        } catch (err: any) {
          toolResult = `Error executing tool: ${err.message}`;
        }

        conversation.push(
          new ToolMessage({
            tool_call_id: `intercepted_${Date.now()}`,
            content:
              typeof toolResult === "string"
                ? toolResult
                : JSON.stringify(toolResult),
            name: parsedJson.name,
          })
        );

        const finalMessage = await llmWithTools.invoke(conversation);
        return extractTextContent(
          finalMessage.content as string | (string | { text?: string })[]
        );
      }
    } catch {
      // Fallthrough to plain text reply
    }
  }

  return contentString || FALLBACK;
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * handleAiChat
 * ─────────────
 * Core AI engine. Accepts user identity + raw message, returns a sanitised
 * string reply. All LangChain, MongoDB, and prompt logic lives here.
 *
 * @param userId   - MongoDB ObjectId string of the authenticated user.
 * @param userRole - "student" | "admin"  (drives tool set & system prompt).
 * @param message  - Raw text message from the user.
 * @returns        - The AI's sanitised reply as a plain string.
 */
export async function handleAiChat(
  userId: string,
  userRole: string,
  message: string
): Promise<string> {
  // 1. Provider switch (reads AI_PROVIDER from .env, defaults to openai)
  const llm = buildLLM();

  // 2. Role-based tools & system prompt (includes dynamic Cairo date context)
  const { prompt: systemPromptText, tools } = buildSystemPrompt(userRole, userId);

  // 3. Bind tools to the LLM
  const llmWithTools = llm.bindTools(tools);

  // 4. Load last 15 messages from MongoDB (persistent memory)
  const dbHistory = await AiChatHistory.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Re-order chronologically (we fetched newest-first to limit correctly)
  dbHistory.reverse();

  const historyMessages: (HumanMessage | AIMessage)[] = dbHistory.map((msg) =>
    msg.role === "assistant"
      ? new AIMessage(msg.content)
      : new HumanMessage(msg.content)
  );

  // 5. Build full conversation array
  const conversation: (SystemMessage | HumanMessage | AIMessage | ToolMessage)[] = [
    new SystemMessage(systemPromptText),
    ...historyMessages,
    new HumanMessage(message.trim()),
  ];

  // 6. Execute agent (two-pass tool loop + JSON failsafe)
  let reply = await runToolLoop(llmWithTools as any, conversation, tools);

  // 7. Sanitize: strip leaked markdown / tool names
  reply = sanitizeReply(reply);

  if (!reply) {
    reply = "I am processing your request. Please hold on a moment.";
  }

  // 8. Persist the clean exchange to MongoDB
  await AiChatHistory.insertMany([
    { user: userId, role: "user", content: message.trim() },
    { user: userId, role: "assistant", content: reply },
  ]);

  return reply;
}
