import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { getAllUsers,getProfile } from "../Controllers/userController";


const router = express.Router();

router.get("/", protect, allowRoles("admin"), getAllUsers);
router.get("/profile", protect, getProfile);

export default router;