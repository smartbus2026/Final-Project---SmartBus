import express from "express";
import { protect } from "../middleware/authMiddleware";
import { sendMessage,getMessages } from "../Controllers/chatController";


const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/", protect, getMessages);

export default router;