"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const tripController_1 = require("../Controllers/tripController");
const router = express_1.default.Router();
// GET /api/driver/trips strictly filtered by driver and today's date
router.get("/trips", authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)("driver"), tripController_1.getDriverTrips);
exports.default = router;
