"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const supportController_1 = require("../Controllers/supportController");
const router = express_1.default.Router();
// Student routes
router.post("/", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("student"), supportController_1.createTicket);
router.get("/my", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("student"), supportController_1.getMyTickets);
// Admin routes
router.get("/", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), supportController_1.getAllTickets);
router.put("/:id", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("admin"), supportController_1.updateTicketStatus);
exports.default = router;
