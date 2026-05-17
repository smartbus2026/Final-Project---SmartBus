import express from "express";
import { protect } from "../middleware/authMiddleware";
import { sendMessage, getMessages } from "../controllers/chatController";

const router = express.Router();

// 🟢 المسارات بقت بسيطة ومفيهاش Parameters
router.get("/", protect, getMessages); 
router.post("/", protect, sendMessage); 

export default router;