import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { 
    getAllUsers, 
    getProfile, 
    updateUser, 
    deleteUser  
} from "../controllers/userController";

const router = express.Router();

router.get("/", protect, allowRoles("admin"), getAllUsers);

router.get("/profile", protect, getProfile);

router.put("/:id", protect, allowRoles("admin"), updateUser);

router.delete("/:id", protect, allowRoles("admin"), deleteUser);

export default router;