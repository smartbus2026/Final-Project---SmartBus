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

export const approveProposal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = (req as any).user.id; // From protect middleware
        
        const proposal = await AssignmentProposal.findById(id);
        if (!proposal) {
            res.status(404).json({ status: "error", message: "Proposal not found." });
            return;
        }
        if (proposal.status !== "pending") {
            res.status(400).json({ status: "error", message: "Proposal is no longer pending." });
            return;
        }

        // Loop and assign
        let assignedCount = 0;
        for (const assignment of proposal.assignments) {
            for (const bookingId of assignment.studentBookings) {
                try {
                    await assignBusToBooking(bookingId.toString(), assignment.busNumber, adminId);
                    assignedCount++;
                } catch (err: any) {
                    console.error(`Failed to assign booking ${bookingId}:`, err.message);
                }
            }
        }

        proposal.status = "approved_by_admin";
        await proposal.save();

        res.status(200).json({ status: "ok", message: `Successfully assigned ${assignedCount} bookings.` });
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
