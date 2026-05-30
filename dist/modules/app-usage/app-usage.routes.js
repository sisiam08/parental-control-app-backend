"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_usage_controller_1 = require("./app-usage.controller");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const router = (0, express_1.Router)();
const controller = new app_usage_controller_1.AppUsageController();
// Companion Device uploads usage logs
router.post("/children/app-usage", auth_1.authenticateDevice, rateLimiter_1.telemetryLimiter, (req, res, next) => controller.upload(req, res, next));
// Parent dashboard limit setters and monitors (Parent authenticated)
router.get("/children/:childId/app-usage", auth_1.authenticateParent, (req, res, next) => controller.getUsage(req, res, next));
router.post("/children/:childId/app-blocks", auth_1.authenticateParent, (req, res, next) => controller.toggleBlock(req, res, next));
router.post("/children/:childId/screen-time", auth_1.authenticateParent, (req, res, next) => controller.setLimit(req, res, next));
router.post("/children/:childId/website-filters", auth_1.authenticateParent, (req, res, next) => controller.filterDomain(req, res, next));
exports.default = router;
