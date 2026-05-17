import express from "express";
import { protect } from "../middleware/authMiddleware";
import { getActiveGroupChat, sendMessage, getMessages } from "../Controllers/chatController";

const router = express.Router();

router.get("/active-group", protect, getActiveGroupChat);
router.get("/:roomId", protect, getMessages); 
router.post("/:roomId", protect, sendMessage); 

export default router;