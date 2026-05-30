import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";
import childrenRouter from "../modules/children/children.routes";
import devicesRouter from "../modules/devices/devices.routes";
import locationsRouter from "../modules/locations/locations.routes";
import appUsageRouter from "../modules/app-usage/app-usage.routes";
import socialSpyRouter from "../modules/social-spy/social-spy.routes";
import notificationsRouter from "../modules/notifications/notifications.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/children", childrenRouter);
router.use("/devices", devicesRouter);
router.use("/locations", locationsRouter);
router.use("/", appUsageRouter);
router.use("/", socialSpyRouter);
router.use("/", notificationsRouter);

export default router;
