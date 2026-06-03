import mongoose from "mongoose";
import Booking from "../models/Booking.model";
import Bus from "../models/Bus";
import AppNotification from "../models/Notification.model";

const executeSequentialAssignmentFallback = async (bookingId: string, busNumber: string, adminId: string) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    const bus = await Bus.findOne({ busCode: busNumber });
    if (!bus) {
      throw new Error(`Bus not found: ${busNumber}`);
    }
    
    const originalStatus = booking.status;
    const originalBusId = booking.busId;
    
    try {
        booking.status = 'assigned';
        booking.busId = bus._id as mongoose.Types.ObjectId;
        await booking.save();

        await AppNotification.create({
          userId: booking.user,
          message: `Your booking has been assigned to Bus ${busNumber}`
        });

        return { success: true, message: `Successfully assigned bus ${busNumber} to booking ${bookingId} (fallback)` };
    } catch (e: any) {
        // Rollback
        booking.status = originalStatus;
        booking.busId = originalBusId;
        await booking.save();
        throw new Error(`Fallback assignment failed: ${e.message}`);
    }
};

export const assignBusToBooking = async (bookingId: string, busNumber: string, adminId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    const bus = await Bus.findOne({ busCode: busNumber }).session(session);
    if (!bus) {
      throw new Error(`Bus not found: ${busNumber}`);
    }

    booking.status = 'assigned';
    booking.busId = bus._id as mongoose.Types.ObjectId;
    await booking.save({ session });

    await AppNotification.create([{
      userId: booking.user,
      message: `Your booking has been assigned to Bus ${busNumber}`
    }], { session });

    await session.commitTransaction();
    session.endSession();
    return { success: true, message: `Successfully assigned bus ${busNumber} to booking ${bookingId}` };
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    // Fallback for standalone MongoDB (No transaction support)
    if (error.message && error.message.includes("transaction")) {
        console.warn("Transactions not supported. Falling back to sequential assignment.");
        return await executeSequentialAssignmentFallback(bookingId, busNumber, adminId);
    }
    
    throw error;
  }
};
