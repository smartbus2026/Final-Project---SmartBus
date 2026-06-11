import { Request, Response } from "express";
import { generateDailyProposal } from "../services/proposalService";

export const generateProposal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date, tripType } = req.body;
        
        if (!date || !tripType) {
            res.status(400).json({ status: "error", message: "date and tripType are required." });
            return;
        }

        const proposal = await generateDailyProposal(date, tripType);
        
        res.status(201).json({ status: "ok", data: proposal });
    } catch (error: any) {
        console.error("[Generate Proposal Error]", error);
        
        let statusCode = 500;
        let errorMessage = error.message || "Failed to generate proposal.";

        if (errorMessage.startsWith("404:")) {
            statusCode = 404;
            errorMessage = errorMessage.replace("404:", "");
        }

        res.status(statusCode).json({ status: "error", message: errorMessage });
    }
};

import AssignmentProposal from "../models/AssignmentProposal.model";
import { assignBusToBooking } from "../services/adminServices";

export const getPendingProposals = async (req: Request, res: Response): Promise<void> => {
    try {
        const filter: any = { status: "pending" };
        if (req.query.tripType) {
            filter.tripType = new RegExp(`^${req.query.tripType}$`, "i");
        }

        const proposals = await AssignmentProposal.find(filter)
            .populate({
                path: 'assignments.studentBookings',
                populate: [
                    { path: 'user', select: 'name email' },
                    { path: 'route', select: 'name' }
                ]
            })
            .sort({ targetDate: 1 })
            .lean();
            
        console.log("DB FETCHED PROPOSALS:", proposals);
        res.status(200).json({ status: "ok", data: proposals });
    } catch (error: any) {
        console.error("[Get Pending Proposals Error]", error);
        res.status(500).json({ status: "error", message: error.message || "Failed to fetch proposals." });
    }
};

import Trip from "../models/Trip";
import Booking from "../models/Booking.model";
import Bus from "../models/Bus";
import Notification from "../models/notification";
import { getIO } from "../socket";

export const approveProposal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { assignments } = req.body;
        
        const proposal = await AssignmentProposal.findById(id);
        if (!proposal) {
            res.status(404).json({ status: "error", message: "Proposal not found." });
            return;
        }
        if (proposal.status !== "pending") {
            res.status(400).json({ status: "error", message: "Proposal is no longer pending." });
            return;
        }

        const activeAssignments = assignments || proposal.assignments;
        let assignedCount = 0;

        for (const assignment of activeAssignments) {
            if (!assignment.busId || !assignment.driverId) {
                res.status(400).json({ status: "error", message: "All routes must have a Bus and Driver selected." });
                return;
            }

            const bus = await Bus.findById(assignment.busId);
            if (!bus) continue;

            const bookingIds = assignment.studentBookings.map((b: any) => b._id || b);
            
            await Booking.updateMany(
                { _id: { $in: bookingIds } },
                { $set: { status: "assigned", busId: assignment.busId } }
            );

            assignedCount += bookingIds.length;

            const routeIds = new Set<string>();
            const userIds = new Set<string>();
            for (const b of assignment.studentBookings) {
                routeIds.add(b.route?._id?.toString() || b.route?.toString() || "");
                userIds.add(b.user?._id?.toString() || b.user?.toString() || "");
            }
            routeIds.delete("");

            // The proposal might have a time like "Return 3:30 PM", we extract specificReturnTime if present
            const slotMap: Record<string, any> = { Morning: "morning", Return: "return_1530" };
            let tripTimeSlot = slotMap[proposal.tripType] || "morning";
            // Check if specificReturnTime is present in any booking
            if (proposal.tripType === "Return" && assignment.studentBookings.length > 0) {
                const specTime = assignment.studentBookings[0].specificReturnTime;
                if (specTime === "7:00 PM") tripTimeSlot = "return_1900";
            }

            for (const routeId of Array.from(routeIds)) {
                const passengerCount = assignment.studentBookings.filter(
                    (b: any) => (b.route?._id?.toString() || b.route?.toString()) === routeId
                ).length;

                await Trip.findOneAndUpdate(
                    {
                        route: routeId,
                        driver: assignment.driverId,
                        date: proposal.targetDate,
                        time_slot: tripTimeSlot
                    },
                    {
                        $set: {
                            bus: assignment.busId,
                            bus_number: bus.busCode,
                            total_seats: bus.capacity || 45,
                            booked_seats: passengerCount,
                            status: "scheduled",
                        },
                        $setOnInsert: {
                            route: routeId,
                            driver: assignment.driverId,
                            date: proposal.targetDate,
                            time_slot: tripTimeSlot,
                        }
                    },
                    { upsert: true, new: true }
                );
            }

            const notifMessage = `Your bus has been assigned! Bus No: ${bus.busCode} is now covering your route.`;
            const userArray = Array.from(userIds);
            if (userArray.length > 0) {
                 await Promise.all(userArray.map(uId => 
                    Notification.create({
                        user: uId,
                        title: "Bus Assigned",
                        message: notifMessage,
                        type: "trip",
                        read: false
                    })
                 ));

                 try {
                     const io = getIO();
                     for (const uId of userArray) {
                         io.to(`user:${uId}`).emit("newNotification", {
                             title: "Bus Assigned",
                             message: notifMessage,
                             type: "trip",
                             createdAt: new Date()
                         });
                         io.to(`user:${uId}`).emit("bookingAssigned", {
                             busDetails: { _id: assignment.busId, busCode: bus.busCode },
                             bookingIds: bookingIds
                         });
                     }
                 } catch (e) {}
            }
        }

        proposal.status = "approved_by_admin";
        proposal.assignments = activeAssignments;
        await proposal.save();

        res.status(200).json({ status: "ok", message: `Successfully assigned ${assignedCount} bookings and dispatched buses.` });
    } catch (error: any) {
        console.error("[Approve Proposal Error]", error);
        res.status(500).json({ status: "error", message: error.message || "Failed to approve proposal." });
    }
};

export const editProposal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { assignments } = req.body;
        
        if (!assignments || !Array.isArray(assignments)) {
            res.status(400).json({ status: "error", message: "Valid assignments array is required." });
            return;
        }

        const proposal = await AssignmentProposal.findById(id);
        if (!proposal) {
            res.status(404).json({ status: "error", message: "Proposal not found." });
            return;
        }
        
        if (proposal.status !== "pending") {
            res.status(400).json({ status: "error", message: "Cannot edit a non-pending proposal." });
            return;
        }

        proposal.assignments = assignments;
        await proposal.save();
        
        res.status(200).json({ status: "ok", message: "Proposal updated successfully.", data: proposal });
    } catch (error: any) {
        console.error("[Edit Proposal Error]", error);
        res.status(500).json({ status: "error", message: error.message || "Failed to edit proposal." });
    }
};
