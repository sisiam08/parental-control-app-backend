import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authLimiter } from "../../middleware/rateLimiter";

const router = Router();
const controller = new AuthController();

router.post("/register", authLimiter, (req, res, next) => controller.register(req, res, next));
router.post("/login", authLimiter, (req, res, next) => controller.login(req, res, next));
router.post("/refresh-token", (req, res, next) => controller.refresh(req, res, next));
router.post("/logout", (req, res, next) => controller.logout(req, res, next));

export default router;
