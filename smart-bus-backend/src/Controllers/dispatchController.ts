import { Request, Response } from "express";
import { generateAndSaveDispatchPlan } from "../services/dispatchManager";

export const generateDispatchController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetDate, shift, time } = req.body;

    if (!targetDate || !shift) {
      res.status(400).json({ error: "targetDate and shift are required" });
      return;
    }

    const proposal = await generateAndSaveDispatchPlan(targetDate, shift, time);

    res.status(201).json({
      message: "Dispatch plan generated successfully",
      proposal
    });
  } catch (error: any) {
    console.error("[generateDispatchController] Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate dispatch plan" });
  }
};
