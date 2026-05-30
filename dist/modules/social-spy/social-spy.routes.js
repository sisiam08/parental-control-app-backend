"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const social_spy_controller_1 = require("./social-spy.controller");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const router = (0, express_1.Router)();
const controller = new social_spy_controller_1.SocialSpyController();
// Device telemetry uploads (Device authenticated + Rate limited)
router.post("/devices/spy/messages", auth_1.authenticateDevice, rateLimiter_1.telemetryLimiter, (req, res, next) => controller.uploadMessages(req, res, next));
router.post("/devices/spy/screen", auth_1.authenticateDevice, rateLimiter_1.telemetryLimiter, (req, res, next) => controller.uploadScreen(req, res, next));
// Parent oversight monitors (Parent authenticated)
router.get("/children/:childId/spy/messages", auth_1.authenticateParent, (req, res, next) => controller.getMessages(req, res, next));
router.get("/children/:childId/spy/screens", auth_1.authenticateParent, (req, res, next) => controller.getScreens(req, res, next));
exports.default = router;
