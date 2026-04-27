import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";
import { 
    getAllUsers, 
    getProfile, 
    updateUser, 
    deleteUser  
} from "../Controllers/userController";

const router = express.Router();

router.get("/", protect, allowRoles("admin"), getAllUsers);

router.get("/profile", protect, getProfile);

// Students can update their own profile; admin can update anyone's
router.put("/:id", protect, updateUser);

router.delete("/:id", protect, allowRoles("admin"), deleteUser);

export default router;