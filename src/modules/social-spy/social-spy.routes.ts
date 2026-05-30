import { Router } from "express";
import { SocialSpyController } from "./social-spy.controller";
import { authenticateDevice, authenticateParent } from "../../middleware/auth";
import { telemetryLimiter } from "../../middleware/rateLimiter";

const router = Router();
const controller = new SocialSpyController();

// Device telemetry uploads (Device authenticated + Rate limited)
router.post("/devices/spy/messages", authenticateDevice, telemetryLimiter, (req, res, next) => controller.uploadMessages(req, res, next));
router.post("/devices/spy/screen", authenticateDevice, telemetryLimiter, (req, res, next) => controller.uploadScreen(req, res, next));

// Parent oversight monitors (Parent authenticated)
router.get("/children/:childId/spy/messages", authenticateParent, (req, res, next) => controller.getMessages(req, res, next));
router.get("/children/:childId/spy/screens", authenticateParent, (req, res, next) => controller.getScreens(req, res, next));

export default router;
