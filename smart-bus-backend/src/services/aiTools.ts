import { tool } from "@langchain/core/tools";
import mongoose from "mongoose";
import { z } from "zod";
import { createBooking, cancelBooking, getDemandAggregation } from "../Controllers/bookingController";
import Route from "../models/Route";
import SystemSettings from "../models/SystemSettings.model";

import Booking from "../models/Booking.model";

// Helper to invoke an express controller for AI Tools
const invokeController = (controller: any, reqData: any): Promise<any> => {
  return new Promise((resolve) => {
    let statusCode = 200;
    const req = { ...reqData };
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        resolve({ statusCode, data });
      },
      send: (data: any) => {
        resolve({ statusCode, data });
      }
    };
    try {
      controller(req as any, res as any).catch((err: any) => {
        resolve({ statusCode: 500, data: { error: err.message } });
      });
    } catch (err: any) {
      resolve({ statusCode: 500, data: { error: err.message } });
    }
  });
};

const bookTripTool = tool(
  async ({ userId, routeName, date, timeSlot, specificReturnTime }) => {
    try {
      const route = await Route.findOne({ name: { $regex: routeName, $options: 'i' } });
      if (!route) {
        return 'ERROR: Route not found. Ask the user to clarify the route name (e.g., Stadium, Seil, Aqaleem).';
      }
      
      if (timeSlot === "Return" && !specificReturnTime) {
        return 'ERROR: specificReturnTime is required for Return trips. Ask the user to choose between 3:30 PM and 7:00 PM.';
      }
      
      const existingBookings = await Booking.find({ user: userId, date, status: { $ne: "cancelled" } }).lean();
      if (existingBookings && Array.isArray(existingBookings)) {
        for (const b of existingBookings) {
          if (b.timeSlot.toLowerCase() === timeSlot.toLowerCase()) {
            return `ERROR: You already have a ${timeSlot} trip. Limit reached.`;
          }
        }
      }
      
      const reqData = {
        user: { id: userId, role: "student" },
        body: { routeId: route._id, date, timeSlot, specificReturnTime }
      };
      const response = await invokeController(createBooking, reqData);
      if (response.statusCode >= 400) {
        const errorMsg = response.data?.error || response.data?.message || JSON.stringify(response.data);
        return `ERROR: ${errorMsg}`;
      }
      return `SUCCESS: You will receive a notification when the admin assigns you to a bus. Details: ${JSON.stringify(response.data)}`;
    } catch (error: any) {
      return `ERROR: ${error.message}`;
    }
  },
  {
    name: "bookTripTool",
    description: "Books a trip for a student. Enforces all booking rules such as daily limits and time windows.",
    schema: z.object({
      userId: z.string().describe("The ID of the user booking the trip"),
      routeName: z.string().describe("The name of the route (e.g., Stadium)"),
      date: z.string().describe("The date of the trip in YYYY-MM-DD format"),
      timeSlot: z.enum(["Morning", "Return"]).describe("The time slot for the trip"),
      specificReturnTime: z.string().optional().describe("Required if timeSlot is Return, e.g., '15:30' or '19:00'")
    })
  }
);

const cancelTripTool = tool(
  async ({ userId, tripType, targetDate }) => {
    try {
      console.log('AI Passed Description:', tripType, targetDate);
      
      const desc = tripType.toLowerCase();
      
      // Step A: Fetch all active bookings for this user on the targetDate
      const queryDate = new Date(targetDate);
      
      const bookings = await Booking.find({ 
        user: userId, 
        status: { $ne: "cancelled" },
        date: queryDate
      })
      .populate("route", "name")
      .lean();
        
      if (!bookings || bookings.length === 0) {
        return `ERROR: No active bookings found on ${targetDate}.`;
      }
      
      // Step B: Iterate and Match
      let matchedBooking = null;
      for (const b of bookings) {
        const timeSlot = b.timeSlot.toLowerCase();
        
        if ((desc.includes('morning') || desc.includes('صباح')) && timeSlot === 'morning') {
          matchedBooking = b;
          break;
        }
        if ((desc.includes('return') || desc.includes('evening') || desc.includes('عودة')) && timeSlot === 'return') {
          matchedBooking = b;
          break;
        }
      }
      
      if (!matchedBooking) {
        return `ERROR: Could not find a '${tripType}' trip to cancel on ${targetDate}.`;
      }
      
      const bookingId = matchedBooking._id.toString();
      
      // Verify valid ObjectId
      if (!/^[0-9a-fA-F]{24}$/.test(bookingId)) {
        return `ERROR: Invalid booking ID extracted: ${bookingId}`;
      }
      
      const reqData = {
        user: { id: userId, role: "student" },
        params: { id: bookingId }
      };
      
      const response = await invokeController(cancelBooking, reqData);
      
      if (response.statusCode >= 400) {
        const errorMsg = response.data?.error || response.data?.message || JSON.stringify(response.data);
        return `ERROR: ${errorMsg}`;
      }
      return `SUCCESS: Trip cancelled successfully. Details: ${JSON.stringify(response.data)}`;
    } catch (error: any) {
      return `ERROR: ${error.message}`;
    }
  },
  {
    name: "cancelTripTool",
    description: "Cancels an existing booking.",
    schema: z.object({
      userId: z.string().describe("The ID of the user cancelling the trip"),
      tripType: z.string().describe("Must strictly be either 'morning' or 'return', derived from the context, ignoring 'yes' or 'ok'."),
      targetDate: z.string().describe("The specific date of the trip to cancel in YYYY-MM-DD format")
    })
  }
);

const getUserBookingsTool = tool(
  async ({ userId }) => {
    try {
      const bookings = await Booking.find({ user: userId, status: { $ne: "cancelled" } })
        .populate("route", "name")
        .lean();
        
      if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
        return "No active bookings found for this user.";
      }
      
      const simplifiedBookings = bookings.map((b: any) => {
        const timeSlot = b?.timeSlot || "Unknown Slot";
        let exactTime = "Morning Slot (Default Time)";
        
        if (typeof timeSlot === "string" && timeSlot.toLowerCase() === "return") {
          exactTime = b?.specificReturnTime || b?.trip?.time || "Return Slot (Unspecified Time)";
        }
        
        const routeName = b?.route?.name || "Unknown Route";
        let dateStr = "Unknown Date";
        if (b?.date) {
           dateStr = b.date instanceof Date ? b.date.toISOString().split('T')[0] : String(b.date);
        }
        const status = b?.status || "Unknown Status";
        const bookingId = b?._id || "Unknown";
        
        // Explicit required format
        return `Booking ID: ${bookingId}, Route: ${routeName}, Date: ${dateStr}, Type: ${timeSlot}, Time: ${exactTime}, Status: ${status}`;
      });
      
      return JSON.stringify(simplifiedBookings);
    } catch (error: any) {
      console.error("[getUserBookingsTool Error]:", error);
      return `Failed to fetch user bookings. Please inform the user that their bookings could not be retrieved at this time.`;
    }
  },
  {
    name: "getUserBookingsTool",
    description: "Fetches the active and upcoming bookings for a specific user.",
    schema: z.object({
      userId: z.string().describe("The ID of the user whose bookings to fetch")
    })
  }
);

const checkAvailableTripsTool = tool(
  async () => {
    try {
      const routes = await Route.find().populate("stops").lean();
      return JSON.stringify(routes);
    } catch (error: any) {
      return `Failed to fetch routes: ${error.message}`;
    }
  },
  {
    name: "checkAvailableTripsTool",
    description: "Queries available routes and their stops.",
    schema: z.object({})
  }
);

const executeSequentialReplaceFallback = async (userId: string, oldTripType: string, newRouteName: string, newTimeSlot: string, targetDate: string, specificReturnTime?: string) => {
    const queryDate = new Date(targetDate);
    const desc = oldTripType.toLowerCase();
    
    // Fetch old trip
    const bookings = await Booking.find({ user: userId, status: { $ne: "cancelled" }, date: queryDate }).lean();
    let oldBooking = null;
    if (bookings && Array.isArray(bookings)) {
      for (const b of bookings) {
        const tSlot = b.timeSlot.toLowerCase();
        if ((desc.includes('morning') || desc.includes('صباح')) && tSlot === 'morning') {
          oldBooking = b; break;
        }
        if ((desc.includes('return') || desc.includes('evening') || desc.includes('عودة')) && tSlot === 'return') {
          oldBooking = b; break;
        }
      }
    }
    
    if (!oldBooking) return `ERROR: Could not find a '${oldTripType}' trip to cancel on ${targetDate}.`;
    
    // Find new route
    const route = await Route.findOne({ name: { $regex: newRouteName, $options: 'i' } });
    if (!route) return 'ERROR: New route not found.';
    
    // Check limit
    for (const b of bookings) {
      if (b._id.toString() !== oldBooking._id.toString() && b.timeSlot.toLowerCase() === newTimeSlot.toLowerCase()) {
         return `ERROR: Cannot replace with ${newTimeSlot}. You already have a ${newTimeSlot} trip.`;
      }
    }
    
    // Delete/Cancel old trip
    await Booking.findByIdAndUpdate(oldBooking._id, { status: 'cancelled' });
    
    try {
      // Create new
      await Booking.create({
          user: userId,
          route: route._id,
          date: queryDate,
          timeSlot: newTimeSlot,
          specificReturnTime: newTimeSlot === "Return" ? specificReturnTime : undefined,
          status: "pending"
      });
      return `SUCCESS: Successfully replaced trip (fallback mode). You will receive a notification when the admin assigns you to a bus.`;
    } catch (e: any) {
      // Manual Rollback
      await Booking.findByIdAndUpdate(oldBooking._id, { status: 'pending' });
      return `ERROR: Failed to create new booking, rolled back old cancellation. ${e.message}`;
    }
};

const replaceTripTool = tool(
  async ({ userId, oldTripType, newRouteName, newTimeSlot, targetDate, specificReturnTime }) => {
    try {
      if (newTimeSlot === "Return" && !specificReturnTime) {
        return 'ERROR: specificReturnTime is required for the new Return trip. Ask the user to choose between 3:30 PM and 7:00 PM.';
      }
      
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        const queryDate = new Date(targetDate);
        const desc = oldTripType.toLowerCase();
        
        // 1. Fetch old trip
        const bookings = await Booking.find({ user: userId, status: { $ne: "cancelled" }, date: queryDate }).session(session).lean();
        
        let oldBooking = null;
        if (bookings && Array.isArray(bookings)) {
          for (const b of bookings) {
            const tSlot = b.timeSlot.toLowerCase();
            if ((desc.includes('morning') || desc.includes('صباح')) && tSlot === 'morning') {
              oldBooking = b; break;
            }
            if ((desc.includes('return') || desc.includes('evening') || desc.includes('عودة')) && tSlot === 'return') {
              oldBooking = b; break;
            }
          }
        }
        
        if (!oldBooking) {
          await session.abortTransaction();
          session.endSession();
          return `ERROR: Could not find a '${oldTripType}' trip to cancel on ${targetDate}.`;
        }
        
        // 2. Delete/Cancel old trip
        await Booking.findByIdAndUpdate(oldBooking._id, { status: 'cancelled' }, { session });
        
        // 3. Find new route
        const route = await Route.findOne({ name: { $regex: newRouteName, $options: 'i' } }).session(session);
        if (!route) {
          await session.abortTransaction();
          session.endSession();
          return 'ERROR: New route not found. Ask the user to clarify the route name (e.g., Stadium, Seil, Aqaleem).';
        }
        
        // 4. Check limits
        const remainingBookings = await Booking.find({ user: userId, status: { $ne: "cancelled" }, date: queryDate }).session(session).lean();
        if (remainingBookings && Array.isArray(remainingBookings)) {
          for (const b of remainingBookings) {
            if (b.timeSlot.toLowerCase() === newTimeSlot.toLowerCase()) {
              await session.abortTransaction();
              session.endSession();
              return `ERROR: Cannot replace with ${newTimeSlot}. You already have a ${newTimeSlot} trip on this date. Limit reached.`;
            }
          }
        }
        
        // 5. Create new trip
        await Booking.create([{
          user: userId,
          route: route._id,
          date: queryDate,
          timeSlot: newTimeSlot,
          specificReturnTime: newTimeSlot === "Return" ? specificReturnTime : undefined,
          status: "pending"
        }], { session });
        
        await session.commitTransaction();
        session.endSession();
        return `SUCCESS: Successfully replaced trip atomically. You will receive a notification when the admin assigns you to a bus.`;
      } catch (innerError: any) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
        
        if (innerError.message && innerError.message.includes("transaction")) {
            console.warn("Transactions not supported by DB. Falling back to sequential replace.");
            return await executeSequentialReplaceFallback(userId, oldTripType, newRouteName, newTimeSlot, targetDate, specificReturnTime);
        }
        return `ERROR: Internal transaction failure: ${innerError.message}`;
      }
    } catch (error: any) {
      return `ERROR: ${error.message}`;
    }
  },
  {
    name: "replaceTripTool",
    description: "Replaces an existing trip with a new one. Performs atomic cancellation and rebooking. Requires old trip type, new route, new timeslot, date, and optionally new specific return time.",
    schema: z.object({
      userId: z.string().describe("The ID of the user"),
      oldTripType: z.string().describe("The type of the trip being cancelled (e.g., 'morning' or 'return')"),
      newRouteName: z.string().describe("The name of the new route (e.g., Stadium)"),
      newTimeSlot: z.enum(["Morning", "Return"]).describe("The time slot for the new trip"),
      targetDate: z.string().describe("The specific date of the trip in YYYY-MM-DD format"),
      specificReturnTime: z.string().optional().describe("Required if newTimeSlot is Return, e.g., '15:30' or '19:00'")
    })
  }
);

export const studentTools = [bookTripTool, cancelTripTool, getUserBookingsTool, checkAvailableTripsTool, replaceTripTool];

const getRouteDemandsTool = tool(
  async ({ date }) => {
    const reqData = {
      query: { date }
    };
    const response = await invokeController(getDemandAggregation, reqData);
    if (response.statusCode >= 400) {
      return `Failed to fetch route demands: ${JSON.stringify(response.data)}`;
    }
    return JSON.stringify(response.data);
  },
  {
    name: "getRouteDemandsTool",
    description: "Queries the DB to group and count bookings per route for a specific date.",
    schema: z.object({
      date: z.string().describe("The date to get demands for in YYYY-MM-DD format")
    })
  }
);

const getSystemQuotaTool = tool(
  async () => {
    try {
      let settings = await SystemSettings.findOne().lean();
      if (!settings) {
         return JSON.stringify({ defaultShiftLimit: 7, monthlyBusQuota: 280 }); // Defaults from schema
      }
      return JSON.stringify({
        defaultShiftLimit: settings.defaultShiftLimit,
        monthlyBusQuota: settings.monthlyBusQuota
      });
    } catch (error: any) {
      return `Failed to fetch system quota: ${error.message}`;
    }
  },
  {
    name: "getSystemQuotaTool",
    description: "Fetches the system settings to return the default shift limit and monthly bus quota.",
    schema: z.object({})
  }
);

export const adminTools = [getRouteDemandsTool, getSystemQuotaTool];
