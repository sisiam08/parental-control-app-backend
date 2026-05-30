"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const devices_controller_1 = require("./devices.controller");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const router = (0, express_1.Router)();
const controller = new devices_controller_1.DevicesController();
// Public: Device register using 6-digit code
router.post("/register", (req, res, next) => controller.register(req, res, next));
// Companion Telemetry Endpoints (Secure Device Token authenticated)
router.post("/health", auth_1.authenticateDevice, rateLimiter_1.telemetryLimiter, (req, res, next) => controller.health(req, res, next));
router.get("/commands", auth_1.authenticateDevice, rateLimiter_1.telemetryLimiter, (req, res, next) => controller.getCommands(req, res, next));
router.post("/commands/:id/respond", auth_1.authenticateDevice, rateLimiter_1.telemetryLimiter, (req, res, next) => controller.respondToCommand(req, res, next));
// Remote Parent Command Triggers (Secure Parent authenticated)
router.post("/remote-lock", auth_1.authenticateParent, (req, res, next) => controller.remoteLock(req, res, next));
exports.default = router;
