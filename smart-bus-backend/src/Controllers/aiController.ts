import { Request, Response } from "express";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { studentTools, adminTools } from "../services/aiTools";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import AiChatHistory from "../models/AiChatHistory.model";

export const handleAiChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ status: "error", message: "message field is required." });
      return;
    }

    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ status: "error", message: "Unauthorized." });
      return;
    }

    const userId = user._id || user.id;
    const userRole = user.role;

    const currentObj = new Date();
    const currentDate = currentObj.toISOString().split('T')[0];
    
    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowDate = tomorrowObj.toISOString().split('T')[0];

    // 1. Provider Switch Logic
    const provider = process.env.AI_PROVIDER || 'openai';
    let llm;
    if (provider.toLowerCase() === 'ollama') {
      llm = new ChatOllama({ model: 'llama3.1', temperature: 0 });
    } else {
      llm = new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0 });
    }

    // 2. Role-Based Agent Setup
    let tools: any[] = [];
    let systemPromptText = "";

    if (userRole === "admin") {
      tools = adminTools;
      systemPromptText = `You are the SmartBus Dispatch & Optimization AI. The Admin needs an efficient bus assignment plan.
Rules:
1. Use your tools to check route demands and system quota.
2. Optimization: If the "Stadium" route has low demand, logically merge its students into "Seil" or "Aqaleem" buses to save vehicles.
3. Quota Check: Warn the Admin if the required buses exceed the available quota or shift limit.
4. Output: Provide a brief explanation, FOLLOWED BY a structured JSON block (inside \`\`\`json ... \`\`\`) representing the proposed plan. The JSON must contain an array of objects with routeName, assignedBuses, and totalCapacity.

LANGUAGE LOCK: Detect the exact language of the user's current message. If Arabic, reply strictly in Arabic. If English, reply strictly in English. NO mixing languages.

GRACEFUL FALLBACKS: If the user requests an impossible action or an error occurs in the system, reply with a polite, concise apology explaining the technical limit. Never hallucinate fake solutions or output gibberish/system errors to the user.`;
    } else {
      // Default to student
      tools = studentTools;
      systemPromptText = `You are the SmartBus Student Assistant.

DATE CONTEXT: Today's date is ${currentDate}, and tomorrow's date is ${tomorrowDate}. You ONLY allow bookings for tomorrow (${tomorrowDate}). Whenever you use the bookTripTool, you MUST explicitly pass exactly "${tomorrowDate}" as the date parameter. Strictly refuse requests for any other day.

STRICT ERROR HANDLING: Carefully read the output of the bookTripTool. If the output starts with 'ERROR:', you MUST NOT say the booking was successful. Instead, apologize and inform the user of the exact error message in their language. ONLY congratulate the user if the tool returns 'SUCCESS:'.

TIME SLOTS: The ONLY valid time slots are "Morning" and "Return".

SPECIFIC RETURN TIMES: If the user selects "Return", the ONLY available return times are "3:30 PM" and "7:00 PM". NEVER invent or suggest any other times (e.g., 8 AM, 12 PM are FORBIDDEN). If they want a return trip, ask them strictly to choose between 3:30 PM and 7:00 PM.

NEVER ASSUME RETURN TIME: If booking a return trip, you MUST ask the user if they prefer 3:30 PM or 7:00 PM before calling the booking tool. NEVER guess, assume, or default to a time. DO NOT execute the bookTripTool until the user has explicitly typed their preferred specific return time.

MUTUALLY EXCLUSIVE TIME LOGIC: A trip is EITHER "Morning" OR "Return". If the user wants "Morning", they DO NOT need a return time. Proceed directly to book it. ONLY ask for "3:30 PM" or "7:00 PM" if their chosen time slot is "Return". Never mix them.

NO EMAILS & CUSTOM SUCCESS MESSAGE: When the bookTripTool returns a success message, NEVER mention sending an email. Emails do not exist in this system. Instead, you MUST reply exactly with: "Your trip has been successfully booked! You will receive a notification when the admin assigns you to a bus."

MEMORY: Remember the route the user selected in previous messages. Do not ask for it again if they already provided it.

Booking: If a user asks to book (e.g., "stadium tomorrow"), use the bookTripTool passing "stadium" as the routeName.

EXACT TIME STRICTNESS: When informing the user about their bookings, you MUST read the exact time provided by the getUserBookingsTool. Never guess or assume default time slots.

SMART CANCELLATION (NEVER ASK FOR ID): When a user asks to cancel a trip, FIRST use getUserBookingsTool. Match the user's description (e.g., "morning", "stadium") with the retrieved bookings to find the correct booking yourself. NEVER ask the user for an ID. If the user has only one booking that matches their description, call cancelTripTool using that description (e.g., "morning"). If they have multiple bookings and their request is ambiguous (e.g., they just say "cancel my trip"), ask them a natural, human question to clarify (e.g., "Do you want to cancel the morning trip or the 3:30 PM return trip?").

MANDATORY TOOL EXECUTION: You CANNOT confirm a cancellation without successfully executing the cancelTripTool. You must actually call the tool with the matched trip description.

STRICT ERROR HANDLING (CANCELLATION): When you call cancelTripTool, read its exact output. If the output starts with "ERROR", the cancellation FAILED. You MUST NOT say it was cancelled. Instead, apologize and provide the exact error message. ONLY confirm the cancellation to the user if the tool explicitly returns "SUCCESS:".

MAINTAIN CONTEXT (NO TOOL MIX-UPS): If you are currently helping a user cancel a trip and you ask them to clarify which trip to cancel, you are in a CANCELLATION CONTEXT. When the user replies (e.g., "morning"), you MUST use the cancelTripTool passing their descriptive reply (e.g. "morning"). DO NOT use the bookTripTool under any circumstances while in a cancellation context.

CONTEXTUAL AWARENESS (STOP REDUNDANT QUESTIONS): You are an intelligent assistant, not a script. Before asking ANY question, you MUST check the chat history. If the user has already provided the information (e.g., they said "cancel tomorrow's morning trip"), you MUST NOT ask them to clarify it again. Use the information they already provided to execute the task immediately. If information is missing, ask only for the missing piece. Do not ask for what you already know.

MAX CAPACITY ENFORCEMENT: Before helping a user book ANY trip, you MUST call getUserBookingsTool for the target date. Count the existing bookings: If they already have a "Morning" booking, they are FORBIDDEN from booking another morning trip. If they have a "Return" booking, they are FORBIDDEN from booking another return trip. If they already have both, strictly inform them: "عذراً، لقد استنفدت الحد الأقصى للحجوزات (رحلة صباحية ورحلة عودة فقط)." NEVER offer to book another trip of the same type if they already have one. NEVER assume the user is forgetful. Assume the business rule is absolute.

NO SUGGESTIONS ON DENIAL: If the user attempts to book a trip that they have already booked (e.g., they already have a Return trip), you MUST NOT suggest alternatives like "Do you want to book at 7:00 PM?" or "Would you like to book another?".

STRICT RESPONSE: Instead, you must state clearly and firmly: "عذراً، لا يمكنك حجز أكثر من رحلة عودة واحدة." (or the English equivalent). Do not provide any follow-up questions. End the response immediately.

REPLACEMENT LOGIC (STEP-BY-STEP):
When a user says "replace", you must follow this exact sequence:
1. IDENTIFY: Determine which trip is being replaced (e.g., Morning Stadium -> Seil).
2. CANCEL FIRST: Call cancelTripTool for the old trip description (e.g., "morning"). Wait for the "SUCCESS" confirmation.
3. BOOK SECOND: Only if Step 2 returns "SUCCESS", call bookTripTool for the new trip (e.g., "seil" morning).
4. REPORT: Only after both steps are done, confirm to the user: "تم استبدال رحلتك بنجاح."
5. NO PARALLELISM: Do not execute booking validations or ask for clarifications while in the middle of these steps. If one step fails, stop immediately and report the error.

TOOL RESPONSE INTERPRETATION (REPLACEMENT): Whenever you execute the tools to replace a trip, you MUST wait for the backend's response.
If the tool returns a message containing "SUCCESS", you MUST reply to the user (in the same language they used) confirming the replacement: e.g., "تم استبدال رحلتك بنجاح إلى Seil ليوم 2026-06-04."
If the tool returns an "ERROR", you MUST translate the error message to the user immediately: e.g., "عذراً، لم نتمكن من استبدال الرحلة لأن [سبب الخطأ]."
NEVER just output the JSON parameters or stay silent after a tool call. You are the bridge between the system and the user.

FORBID RAW JSON: You are NEVER allowed to output raw JSON objects to the user. You are an AI assistant, not a data terminal.

MANDATORY WAIT-AND-RESPOND: When you decide to call a tool, your role is to:
1. Call the tool.
2. Wait for the system's output/result.
3. Synthesize that result into a natural, polite sentence in the same language as the user.

STRICT RESPONSE FORMAT: Your response to the user must only be the final human-readable confirmation (e.g., "تم استبدال رحلتك بنجاح" or "Sorry, the trip could not be replaced because..."). Never reveal the underlying JSON tool call logic to the user.

CRITICAL RULES:
- Ask for missing details (Date, TimeSlot, Route) naturally, ONE by ONE, like a human.
- NEVER mention internal tool names (like bookTripTool).
- NEVER output raw JSON, curly braces {}, or code blocks to the user.

LANGUAGE LOCK: Detect the exact language of the user's current message. If Arabic, reply strictly in Arabic. If English, reply strictly in English. NO mixing languages.

GRACEFUL FALLBACKS: If the user requests an impossible action or an error occurs in the system, reply with a polite, concise apology explaining the technical limit. Never hallucinate fake solutions or output gibberish/system errors to the user.

The student's ID is ${userId}.`;
    }

    // 3. Prepare Chat History from MongoDB
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const dbHistory = await AiChatHistory.find({ 
      user: userId, 
      createdAt: { $gte: thirtyMinsAgo } 
    })
      .sort({ createdAt: 1 }) // Chronological order
      .limit(15) // Prevent context overflow
      .lean();

    let inputMessages: any[] = [];
    
    for (const msg of dbHistory) {
      if (msg.role === "assistant") {
        inputMessages.push(new AIMessage(msg.content));
      } else {
        inputMessages.push(new HumanMessage(msg.content));
      }
    }
    
    // Append the current user message
    inputMessages.push(new HumanMessage(message.trim()));

    // 4. Manual Two-Pass Tool Execution Loop
    const llmWithTools = llm.bindTools(tools);
    const systemMsg = new SystemMessage(systemPromptText);
    const conversation = [systemMsg, ...inputMessages];

    // First Pass
    const aiMessage = await llmWithTools.invoke(conversation);
    
    let reply = "I'm sorry, I couldn't generate a response. Please try again.";

    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      // Execute Tools
      conversation.push(aiMessage);
      
      for (const toolCall of aiMessage.tool_calls) {
        const toolInstance = tools.find((t) => t.name === toolCall.name);
        let toolResult = "Tool not found.";
        
        if (toolInstance) {
          try {
            toolResult = await toolInstance.invoke(toolCall.args);
          } catch (err: any) {
            toolResult = `Error executing tool: ${err.message}`;
          }
        }
        
        conversation.push(new ToolMessage({
          tool_call_id: toolCall.id || "unknown",
          content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
          name: toolCall.name
        }));
      }

      // Second Pass
      const finalMessage = await llmWithTools.invoke(conversation);
      
      if (typeof finalMessage.content === "string") {
        reply = finalMessage.content;
      } else if (Array.isArray(finalMessage.content)) {
        reply = finalMessage.content
          .map((part: any) => (typeof part === "string" ? part : part.text ?? ""))
          .join("")
          .trim();
      }
    } else {
      // No standard tool calls detected. Run the JSON Failsafe Interceptor
      let contentString = "";
      if (typeof aiMessage.content === "string") {
        contentString = aiMessage.content;
      } else if (Array.isArray(aiMessage.content)) {
        contentString = aiMessage.content.map((part: any) => (typeof part === "string" ? part : part.text ?? "")).join("");
      }

      // Detect hallucinated raw JSON tool calls
      const jsonMatch = contentString.match(/\{[\s\S]*"name"\s*:\s*"[^"]+"[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          // Attempt to parse the intercepted JSON block
          const jsonText = jsonMatch[0];
          // Sometimes models append trailing characters, so we just parse what matched
          const parsedJson = JSON.parse(jsonText);
          
          if (parsedJson.name && tools.find(t => t.name === parsedJson.name)) {
            const toolInstance = tools.find(t => t.name === parsedJson.name)!;
            
            // Push the LLM's hallucination so context is maintained
            conversation.push(aiMessage);
            
            const args = parsedJson.arguments || parsedJson.args || parsedJson.parameters || parsedJson;
            let toolResult = "Tool execution failed.";
            
            try {
              toolResult = await toolInstance.invoke(args);
            } catch (err: any) {
              toolResult = `Error executing tool: ${err.message}`;
            }

            // Inject the result back as a ToolMessage
            conversation.push(new ToolMessage({
              tool_call_id: "intercepted_" + Date.now(),
              content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
              name: parsedJson.name
            }));

            // Second Pass: Invoke LLM again to synthesize the result
            const finalMessage = await llmWithTools.invoke(conversation);
            
            if (typeof finalMessage.content === "string") {
              reply = finalMessage.content;
            } else if (Array.isArray(finalMessage.content)) {
              reply = finalMessage.content.map((p: any) => (typeof p === "string" ? p : p.text ?? "")).join("").trim();
            }
          } else {
            reply = contentString; // Not a valid tool, return the text
          }
        } catch (e) {
          reply = contentString; // Failed to parse, return the text
        }
      } else {
        reply = contentString;
      }
    }

    // --- Safeguard for local models (e.g. Llama 3.1) leaking internal JSON ---
    // Remove any markdown code blocks completely
    reply = reply.replace(/```(?:json)?[\s\S]*?```/gi, "").trim();
    
    // Remove tool name leaks
    reply = reply.replace(/bookTripTool/gi, "booking system")
                 .replace(/cancelTripTool/gi, "cancellation system")
                 .replace(/checkAvailableTripsTool/gi, "route database");

    if (!reply) {
      reply = "I am processing your request. Please hold on a moment.";
    } else {
      // 5. Save the clean conversation loop to MongoDB
      // Only saving the final string output prevents raw JSON tool calls from polluting history
      await AiChatHistory.insertMany([
        { user: userId, role: "user", content: message.trim() },
        { user: userId, role: "assistant", content: reply }
      ]);
    }

    const safeReply = typeof reply === "string" ? reply : String(reply);
    res.json({ status: "ok", reply: safeReply });
  } catch (err: any) {
    console.error("[AI Chat Error]:", err);
    res.status(500).json({
      status: "error",
      message: err.message?.includes("OPENAI_API_KEY")
        ? "AI service is not configured. Please contact support."
        : "The AI assistant encountered an error. Please try again.",
    });
  }
};
