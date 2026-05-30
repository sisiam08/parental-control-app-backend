import { Router } from "express";
import { NotificationsController } from "./notifications.controller";
import { authenticateDevice, authenticateParent } from "../../middleware/auth";
import { telemetryLimiter } from "../../middleware/rateLimiter";

const router = Router();
const controller = new NotificationsController();

// Companion Device endpoints (Device authenticated + Rate limited)
router.post("/devices/sos/trigger", authenticateDevice, telemetryLimiter, (req, res, next) => controller.triggerSOS(req, res, next));
router.post("/devices/check-in/:id/respond", authenticateDevice, telemetryLimiter, (req, res, next) => controller.respondCheckIn(req, res, next));

// Parent Dashboard Alert and Request Routes (Parent authenticated)
router.get("/notifications", authenticateParent, (req, res, next) => controller.getAlerts(req, res, next));
router.patch("/notifications/:id/read", authenticateParent, (req, res, next) => controller.readAlert(req, res, next));
router.post("/children/:childId/sos/resolve", authenticateParent, (req, res, next) => controller.resolveSOS(req, res, next));
router.post("/children/:childId/check-in", authenticateParent, (req, res, next) => controller.checkIn(req, res, next));

export default router;
