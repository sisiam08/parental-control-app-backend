import { Router } from "express";
import { ChildrenController } from "./children.controller";
import { authenticateParent } from "../../middleware/auth";

const router = Router();
const controller = new ChildrenController();

// All children endpoints require parent authentication
router.use(authenticateParent);

router.post("/", (req, res, next) => controller.enroll(req, res, next));
router.get("/", (req, res, next) => controller.list(req, res, next));
router.get("/:id", (req, res, next) => controller.details(req, res, next));
router.delete("/:id", (req, res, next) => controller.delete(req, res, next));

export default router;
