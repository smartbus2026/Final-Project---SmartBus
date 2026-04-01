import express from "express";
import { register ,getUsers } from "../Controllers/authController";

const router = express.Router();

router.post("/register", register);
router.get("/users", getUsers);

export default router;