import { Router } from "express";
import { DevicesController } from "./devices.controller";
import { authenticateDevice, authenticateParent } from "../../middleware/auth";
import { telemetryLimiter } from "../../middleware/rateLimiter";

const router = Router();
const controller = new DevicesController();

// Public: Device register using 6-digit code
router.post("/register", (req, res, next) => controller.register(req, res, next));

// Companion Telemetry Endpoints (Secure Device Token authenticated)
router.post("/health", authenticateDevice, telemetryLimiter, (req, res, next) => controller.health(req, res, next));
router.get("/commands", authenticateDevice, telemetryLimiter, (req, res, next) => controller.getCommands(req, res, next));
router.post("/commands/:id/respond", authenticateDevice, telemetryLimiter, (req, res, next) => controller.respondToCommand(req, res, next));

// Remote Parent Command Triggers (Secure Parent authenticated)
router.post("/remote-lock", authenticateParent, (req, res, next) => controller.remoteLock(req, res, next));

export default router;
