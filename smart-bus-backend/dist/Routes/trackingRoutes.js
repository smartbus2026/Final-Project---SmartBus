"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const trackingController_1 = require("../Controllers/trackingController");
const router = express_1.default.Router();
router.get("/buses", trackingController_1.getActiveBuses);
router.get("/buses/:busId", trackingController_1.getBusData);
router.patch("/buses/:busId/location", trackingController_1.updateBusLocation);
router.get("/routes/:routeId", trackingController_1.getRouteTrackingData);
exports.default = router;
