import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { createBus } from "../Controllers/busController";

const router = express.Router();

router.post("/", protect, allowRoles("admin"), createBus);

export default router;
