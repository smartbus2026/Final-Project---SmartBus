import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { getSettings, updateSettings } from "../Controllers/settingsController";

const router = express.Router();

router.get("/",  protect, getSettings);
router.put("/",  protect, allowRoles("admin"), updateSettings);

export default router;