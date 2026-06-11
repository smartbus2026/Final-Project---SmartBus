import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import User from "../models/User";
import { getSystemSettings, updateSystemSettings } from "../Controllers/settingsController";

const router = express.Router();

// GET /api/admin/drivers
// Queries User collection for role: 'driver' and returns only _id and name
router.get("/drivers", protect, allowRoles("admin"), async (req, res) => {
  try {
    const drivers = await User.find({ role: "driver" }).select("_id name");
    res.status(200).json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/settings", protect, allowRoles("admin"), getSystemSettings);
router.put("/settings", protect, allowRoles("admin"), updateSystemSettings);

import { generateProposal, getPendingProposals, approveProposal, editProposal } from "../Controllers/proposalController";
import { generateDispatchController } from "../Controllers/dispatchController";
router.post("/proposals/generate", protect, allowRoles("admin"), generateProposal);
router.post("/dispatch/generate", protect, allowRoles("admin"), generateDispatchController);
router.get("/proposals/pending", protect, allowRoles("admin"), getPendingProposals);
router.post("/proposals/:id/approve", protect, allowRoles("admin"), approveProposal);
router.put("/proposals/:id/edit", protect, allowRoles("admin"), editProposal);

export default router;
