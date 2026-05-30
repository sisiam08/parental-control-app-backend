"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const children_controller_1 = require("./children.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const controller = new children_controller_1.ChildrenController();
// All children endpoints require parent authentication
router.use(auth_1.authenticateParent);
router.post("/", (req, res, next) => controller.enroll(req, res, next));
router.get("/", (req, res, next) => controller.list(req, res, next));
router.get("/:id", (req, res, next) => controller.details(req, res, next));
router.delete("/:id", (req, res, next) => controller.delete(req, res, next));
exports.default = router;
