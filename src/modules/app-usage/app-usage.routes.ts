import { Router } from "express";
import { AppUsageController } from "./app-usage.controller";
import { authenticateDevice, authenticateParent } from "../../middleware/auth";
import { telemetryLimiter } from "../../middleware/rateLimiter";

const router = Router();
const controller = new AppUsageController();

// Companion Device uploads usage logs
router.post("/children/app-usage", authenticateDevice, telemetryLimiter, (req, res, next) => controller.upload(req, res, next));

// Parent dashboard limit setters and monitors (Parent authenticated)
router.get("/children/:childId/app-usage", authenticateParent, (req, res, next) => controller.getUsage(req, res, next));
router.post("/children/:childId/app-blocks", authenticateParent, (req, res, next) => controller.toggleBlock(req, res, next));
router.post("/children/:childId/screen-time", authenticateParent, (req, res, next) => controller.setLimit(req, res, next));
router.post("/children/:childId/website-filters", authenticateParent, (req, res, next) => controller.filterDomain(req, res, next));

export default router;
