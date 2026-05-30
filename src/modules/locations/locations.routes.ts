import { Router } from "express";
import { LocationsController } from "./locations.controller";
import { authenticateDevice, authenticateParent } from "../../middleware/auth";
import { telemetryLimiter } from "../../middleware/rateLimiter";

const router = Router();
const controller = new LocationsController();

// Companion Telemetry Upload (Secure Device Token authenticated + rate limited)
router.post("/update", authenticateDevice, telemetryLimiter, (req, res, next) => controller.update(req, res, next));

// Parent Dashboard Query Routes (Secure Parent authenticated)
router.get("/latest/:childId", authenticateParent, (req, res, next) => controller.latest(req, res, next));
router.get("/history/:childId", authenticateParent, (req, res, next) => controller.history(req, res, next));

// Parent Geofence CRUD Routes (Secure Parent authenticated)
router.post("/geofences", authenticateParent, (req, res, next) => controller.createFence(req, res, next));
router.get("/geofences/:childId", authenticateParent, (req, res, next) => controller.listFences(req, res, next));
router.delete("/geofences/:id", authenticateParent, (req, res, next) => controller.deleteFence(req, res, next));

export default router;
