import express from "express";
import {
  getActiveBuses,
  getBusData,
  getRouteTrackingData,
  updateBusLocation,
} from "../Controllers/trackingController";

const router = express.Router();

router.get("/buses", getActiveBuses);
router.get("/buses/:busId", getBusData);
router.patch("/buses/:busId/location", updateBusLocation);
router.get("/routes/:routeId", getRouteTrackingData);

export default router;
