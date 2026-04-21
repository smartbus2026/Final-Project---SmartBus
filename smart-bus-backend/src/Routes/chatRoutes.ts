import express from "express";
import { protect } from "../middleware/authMiddleware";
import { sendMessage,getMessages } from "../Controllers/chatController";


const router = express.Router();

router.get("/:tripId", protect, getMessages); 
router.post("/:tripId", protect, sendMessage); 
export default router;