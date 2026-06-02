"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
// GET /api/admin/drivers
// Queries User collection for role: 'driver' and returns only _id and name
router.get("/drivers", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), async (req, res) => {
    try {
        const drivers = await User_1.default.find({ role: "driver" }).select("_id name");
        res.status(200).json(drivers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
