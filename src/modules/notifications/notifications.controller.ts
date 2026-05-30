import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { NotificationsService } from "./notifications.service";

const notificationsService = new NotificationsService();

export class NotificationsController {
  // Device triggers SOS
  async triggerSOS(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deviceId = req.device?.id;
      const childId = req.device?.childId;
      const { latitude, longitude } = req.body;

      if (!deviceId || !childId) {
        return res.status(403).json({ success: false, message: "Device credentials required" });
      }

      const sos = await notificationsService.triggerSOS(
        deviceId,
        childId,
        latitude !== undefined ? Number(latitude) : undefined,
        longitude !== undefined ? Number(longitude) : undefined
      );

      return res.status(201).json({ success: true, message: "Emergency SOS alert active", data: sos });
    } catch (error) {
      next(error);
    }
  }

  // Parent resolves SOS
  async resolveSOS(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const childId = req.params.childId;
      const parentId = req.user?.id;

      if (!parentId) {
        return res.status(403).json({ success: false, message: "Parent credentials required" });
      }
      if (!childId) {
        return res.status(400).json({ success: false, message: "Child ID is required" });
      }

      const resolved = await notificationsService.resolveSOS(childId, parentId);
      return res.status(200).json({ success: true, message: "SOS alert resolved successfully", data: resolved });
    } catch (error) {
      next(error);
    }
  }

  // Parent queries alerts
  async getAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(403).json({ success: false, message: "Parent credentials required" });
      }

      const alerts = await notificationsService.getAlerts(userId);
      return res.status(200).json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  }

  // Parent marks alert as read
  async readAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(403).json({ success: false, message: "Parent credentials required" });
      }
      if (!id) {
        return res.status(400).json({ success: false, message: "Notification ID is required" });
      }

      await notificationsService.markAsRead(id, userId);
      return res.status(200).json({ success: true, message: "Alert marked as read" });
    } catch (error) {
      next(error);
    }
  }

  // Parent requests interactive Check-In
  async checkIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const childId = req.params.childId;
      const parentId = req.user?.id;
      const { message } = req.body;

      if (!parentId) {
        return res.status(403).json({ success: false, message: "Parent credentials required" });
      }
      if (!childId || !message) {
        return res.status(400).json({ success: false, message: "childId and message details are required" });
      }

      const request = await notificationsService.requestCheckIn(childId, parentId, message);
      return res.status(201).json({ success: true, message: "Check-in command queued successfully", data: request });
    } catch (error) {
      next(error);
    }
  }

  // Child device responds to Check-In request
  async respondCheckIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deviceId = req.device?.id;
      const checkInId = req.params.id;
      const { latitude, longitude } = req.body;

      if (!deviceId) {
        return res.status(403).json({ success: false, message: "Device credentials required" });
      }
      if (!checkInId) {
        return res.status(400).json({ success: false, message: "CheckIn ID is required" });
      }

      const checkIn = await notificationsService.respondCheckIn(
        deviceId,
        checkInId,
        latitude !== undefined ? Number(latitude) : undefined,
        longitude !== undefined ? Number(longitude) : undefined
      );

      return res.status(200).json({ success: true, message: "Check-in response processed successfully", data: checkIn });
    } catch (error) {
      next(error);
    }
  }
}
export default NotificationsController;
