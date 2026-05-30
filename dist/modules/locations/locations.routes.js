"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const locations_controller_1 = require("./locations.controller");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const router = (0, express_1.Router)();
const controller = new locations_controller_1.LocationsController();
// Companion Telemetry Upload (Secure Device Token authenticated + rate limited)
router.post("/update", auth_1.authenticateDevice, rateLimiter_1.telemetryLimiter, (req, res, next) => controller.update(req, res, next));
// Parent Dashboard Query Routes (Secure Parent authenticated)
router.get("/latest/:childId", auth_1.authenticateParent, (req, res, next) => controller.latest(req, res, next));
router.get("/history/:childId", auth_1.authenticateParent, (req, res, next) => controller.history(req, res, next));
// Parent Geofence CRUD Routes (Secure Parent authenticated)
router.post("/geofences", auth_1.authenticateParent, (req, res, next) => controller.createFence(req, res, next));
router.get("/geofences/:childId", auth_1.authenticateParent, (req, res, next) => controller.listFences(req, res, next));
router.delete("/geofences/:id", auth_1.authenticateParent, (req, res, next) => controller.deleteFence(req, res, next));
exports.default = router;
