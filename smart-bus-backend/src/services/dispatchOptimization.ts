import mongoose from "mongoose";
import Booking, { IBooking } from "../models/Booking.model";
import Bus, { IBus } from "../models/Bus";
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";

export interface IAssignmentResult {
  busNumber: string;
  busId: mongoose.Types.ObjectId | null;
  driverId: mongoose.Types.ObjectId | null;
  studentBookings: mongoose.Types.ObjectId[];
}

const getLLM = () => {
    const provider = process.env.AI_PROVIDER || 'openai';
    if (provider.toLowerCase() === 'ollama') {
      return new ChatOllama({ model: 'llama3.1', temperature: 0, format: "json" });
    } else {
      return new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0, modelKwargs: { response_format: { type: "json_object" } } });
    }
};

export const getOptimizationData = async (targetDate: Date, shift: string, time?: string) => {

  // 1. DATE RANGE: use full UTC day range to avoid time-zone mismatch
  const start = new Date(targetDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setUTCHours(23, 59, 59, 999);

  // 2. SHIFT MATCHING: DB stores "Morning" | "Return" (capitalized enum)
  //    Frontend sends 'morning' or 'return' (lowercase) — normalize before querying
  const dbShift = shift.charAt(0).toUpperCase() + shift.slice(1).toLowerCase() as "Morning" | "Return";

  // 3. BUILD QUERY
  const query: any = {
    date: { $gte: start, $lte: end },
    timeSlot: dbShift,
    status: "pending"   // only unassigned bookings; "assigned" means already dispatched
  };

  // 4. TIME MATCHING: use regex for flexible matching (e.g. "3:30" matches "3:30 PM")
  if (shift.toLowerCase() === 'return' && time) {
    query.specificReturnTime = { $regex: new RegExp(time, "i") };
  }

  console.log(`[getOptimizationData] Querying bookings:`, JSON.stringify(query));

  const pendingBookings = await Booking.find(query).populate("route").lean();

  console.log(`[getOptimizationData] Found ${pendingBookings.length} pending bookings for ${dbShift}${time ? ` @ ${time}` : ''} on ${start.toISOString().split('T')[0]}`);

  // Group by route to give AI a cleaner context structure
  const routeGroups: Record<string, { count: number, bookings: string[] }> = {};
  pendingBookings.forEach(booking => {
    const route = booking.route as any;
    const routeName = route?.name?.trim() || "Unknown";
    
    if (!routeGroups[routeName]) {
      routeGroups[routeName] = { count: 0, bookings: [] };
    }
    routeGroups[routeName].count += 1;
    routeGroups[routeName].bookings.push(booking._id.toString());
  });

  // Fetch available active buses, sorted largest-first for efficient packing
  const activeBuses = await Bus.find({ isActive: true }).lean();
  const availableBuses = activeBuses.map(b => ({
    busNumber: b.busCode,
    capacity: b.capacity || 40
  })).sort((a, b) => b.capacity - a.capacity);

  return { routeGroups, availableBuses, pendingBookings };
};

export const generateOptimizationPlan = async (targetDate: Date, shift: string, time?: string): Promise<IAssignmentResult[]> => {
  
  // Use the extracted data fetching logic
  const { routeGroups, availableBuses, pendingBookings } = await getOptimizationData(targetDate, shift, time);

  if (!pendingBookings || pendingBookings.length === 0) {
    throw new Error(`No pending bookings found for shift '${shift}'${time ? ` at ${time}` : ''} on ${targetDate.toISOString().split('T')[0]}.`);
  }

  if (!availableBuses || availableBuses.length === 0) {
    throw new Error("No active buses available in the system.");
  }

  // Inject requested shift, time, and date into the System Prompt Context dynamically
  const formattedTargetDate = targetDate.toISOString().split('T')[0];
  const prompt = `You are the SmartBus Dispatch & Optimization AI. You are generating a dispatch plan for Tomorrow (${formattedTargetDate}), ${shift.charAt(0).toUpperCase() + shift.slice(1)} shift${time ? ` at ${time}` : ""}.
Your job is to assign the pending student bookings to the available buses optimally based on capacity.

You MUST output ONLY a valid JSON object matching this exact schema:
{
  "assignments": [
    { "busNumber": "B123", "studentBookings": ["booking_id1", "booking_id2"] }
  ]
}

Data for Optimization:
- Target: Tomorrow (${formattedTargetDate}), Shift: ${shift}, Time: ${time || "N/A"}
- Route Demands: ${JSON.stringify(routeGroups)}
- Available Buses: ${JSON.stringify(availableBuses)}

Rules:
1. Every single bookingId listed in Route Demands MUST be assigned to exactly one bus. Do not leave any student behind.
2. The total number of studentBookings assigned to a bus CANNOT exceed its capacity.
3. ROUTE RIGIDITY & MERGING (CRITICAL):
   - "Seil" and "Aqaleem" routes are RIGID and must be assigned dedicated buses. They cannot share buses with each other.
   - The "Stadium" route is FLEXIBLE. You MUST use students from the "Stadium" route to fill any empty seats remaining in the "Seil" or "Aqaleem" buses before you assign a new dedicated bus to "Stadium".
4. Output ONLY JSON. No markdown, no explanations, no text before or after the JSON block.`;

  const llm = getLLM();
  const response = await llm.invoke([{ role: "system", content: prompt }]);

  let jsonString = typeof response.content === "string" ? response.content : "";
  jsonString = jsonString.replace(/```(?:json)?/gi, "").replace(/```/gi, "").trim();
  
  // Extract JSON block in case LLM outputs conversational padding
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

  // Map back to expected interface and validate
  const assignments: IAssignmentResult[] = parsed.assignments.map((a: any) => ({
    busNumber: a.busNumber,
    busId: null,
    driverId: null,
    studentBookings: a.studentBookings.map((id: string) => new mongoose.Types.ObjectId(id))
  }));

  return assignments;
};
