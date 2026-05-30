"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_controller_1 = require("./notifications.controller");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const router = (0, express_1.Router)();
const controller = new notifications_controller_1.NotificationsController();
// Companion Device endpoints (Device authenticated + Rate limited)
router.post("/devices/sos/trigger", auth_1.authenticateDevice, rateLimiter_1.telemetryLimiter, (req, res, next) => controller.triggerSOS(req, res, next));
router.post("/devices/check-in/:id/respond", auth_1.authenticateDevice, rateLimiter_1.telemetryLimiter, (req, res, next) => controller.respondCheckIn(req, res, next));
// Parent Dashboard Alert and Request Routes (Parent authenticated)
router.get("/notifications", auth_1.authenticateParent, (req, res, next) => controller.getAlerts(req, res, next));
router.patch("/notifications/:id/read", auth_1.authenticateParent, (req, res, next) => controller.readAlert(req, res, next));
router.post("/children/:childId/sos/resolve", auth_1.authenticateParent, (req, res, next) => controller.resolveSOS(req, res, next));
router.post("/children/:childId/check-in", auth_1.authenticateParent, (req, res, next) => controller.checkIn(req, res, next));
exports.default = router;
