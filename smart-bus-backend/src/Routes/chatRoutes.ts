import express from "express";
import { protect } from "../middleware/authMiddleware";
import { sendMessage, getMessages } from "../controllers/chatController";

const router = express.Router();


router.get("/", protect, getMessages); 
router.post("/", protect, sendMessage); 

export default router;