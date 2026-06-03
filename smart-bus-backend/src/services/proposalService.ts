import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import Booking from "../models/Booking.model";
import Bus from "../models/Bus";
import AssignmentProposal from "../models/AssignmentProposal.model";
import AppNotification from "../models/Notification.model";
import User from "../models/User";

const getLLM = () => {
    const provider = process.env.AI_PROVIDER || 'openai';
    if (provider.toLowerCase() === 'ollama') {
      return new ChatOllama({ model: 'llama3.1', temperature: 0 });
    } else {
      return new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0, modelKwargs: { response_format: { type: "json_object" } } });
    }
};

export const generateDailyProposal = async (targetDate: string, tripType: string) => {
    const queryDate = new Date(targetDate);
    const dayStart = new Date(queryDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(queryDate); dayEnd.setHours(23, 59, 59, 999);

    // Step 1: Query pending bookings
    const pendingBookings = await Booking.find({
        date: { $gte: dayStart, $lte: dayEnd },
        timeSlot: new RegExp(`^${tripType}$`, "i"),
        status: "pending"
    }).populate("route", "name").lean();

    if (!pendingBookings || pendingBookings.length === 0) {
        throw new Error(`404:No pending bookings found for ${tripType} on ${targetDate}.`);
    }

    // Step 2: Query active buses
    const activeBuses = await Bus.find({ isActive: true }).lean();
    if (!activeBuses || activeBuses.length === 0) {
        throw new Error("404:No active buses available in the system.");
    }

    // Step 3: Call LLM
    const prompt = `You are a SmartBus assignment AI. Your job is to assign students to buses.
You MUST output ONLY a valid JSON object matching this exact schema:
{
  "assignments": [
    { "busNumber": "B123", "studentBookings": ["booking_id1", "booking_id2"] }
  ]
}

Bookings to Assign:
${JSON.stringify(pendingBookings.map(b => ({ id: b._id, route: (b.route as any)?.name })))}

Available Buses:
${JSON.stringify(activeBuses.map(b => ({ busNumber: b.busCode, capacity: b.capacity || 50 })))}

Rules:
1. Every booking MUST be assigned to exactly one bus.
2. No bus can exceed its capacity limit.
3. Group students from the same route onto the same bus if possible.
4. Output ONLY JSON. No markdown, no explanations, no text before or after the JSON block.`;

    const llm = getLLM();
    const response = await llm.invoke([{ role: "system", content: prompt }]);

    let jsonString = typeof response.content === "string" ? response.content : "";
    
    // Clean markdown blocks if present
    jsonString = jsonString.replace(/```(?:json)?/gi, "").replace(/```/gi, "").trim();

    // Force extract only the JSON object block to prevent parsing crashes from conversational text
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonString = jsonMatch[0];
    }

    let parsed;
    try {
        parsed = JSON.parse(jsonString);
    } catch (e) {
        console.error("LLM JSON Parse Error. Raw Output:", jsonString);
        throw new Error("LLM returned an invalid JSON structure.");
    }

    if (!parsed.assignments || !Array.isArray(parsed.assignments)) {
        throw new Error("LLM did not return the required 'assignments' array schema.");
    }

    // Determine deadline (default: 2 hours before trip)
    const deadline = new Date(queryDate);
    if (tripType.toLowerCase() === "morning") {
        deadline.setHours(5, 30, 0, 0); // Assuming 7:30 AM trip
    } else {
        deadline.setHours(13, 30, 0, 0); // Assuming 3:30 PM trip
    }

    // Ensure we don't duplicate proposals for the exact same date and type if pending
    await AssignmentProposal.deleteMany({
        targetDate: { $gte: dayStart, $lte: dayEnd },
        tripType: new RegExp(`^${tripType}$`, "i"),
        status: "pending"
    });

    // Step 5: Save Proposal
    const proposal = await AssignmentProposal.create({
        targetDate: queryDate,
        tripType: tripType.charAt(0).toUpperCase() + tripType.slice(1).toLowerCase(),
        assignments: parsed.assignments,
        status: "pending",
        deadline
    });

    // Notify Admins
    const admins = await User.find({ role: "admin" }).select("_id").lean();
    const notifications = admins.map(admin => ({
        userId: admin._id,
        message: `AI generated a new bus assignment proposal for ${tripType} on ${targetDate}. Review and approve before ${deadline.toLocaleTimeString()}.`
    }));

    if (notifications.length > 0) {
        await AppNotification.insertMany(notifications);
    }

    return proposal;
};
