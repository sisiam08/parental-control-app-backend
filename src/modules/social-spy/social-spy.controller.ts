import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { SocialSpyService } from "./social-spy.service";
import { PlatformType } from "@prisma/client";

const socialSpyService = new SocialSpyService();

export class SocialSpyController {
  // Device uploading chats
  async uploadMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deviceId = req.device?.id;
      const childId = req.device?.childId;
      const { messages } = req.body;

      if (!deviceId || !childId) {
        return res.status(403).json({ success: false, message: "Device credentials required" });
      }
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ success: false, message: "Messages must be a valid array" });
      }

      const data = await socialSpyService.saveMessages(deviceId, childId, messages);
      return res.status(201).json({ success: true, message: "Chats audited successfully", data });
    } catch (error) {
      next(error);
    }
  }

  // Parent queries chat logs
  async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const childId = req.params.childId;
      const { platform } = req.query;

      if (!childId) {
        return res.status(400).json({ success: false, message: "Child ID is required" });
      }

      const data = await socialSpyService.getMessages(childId, platform as PlatformType | undefined);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // Device uploads screenshot captures
  async uploadScreen(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deviceId = req.device?.id;
      const childId = req.device?.childId;
      const { imageUrl } = req.body;

      if (!deviceId || !childId) {
        return res.status(403).json({ success: false, message: "Device credentials required" });
      }
      if (!imageUrl) {
        return res.status(400).json({ success: false, message: "imageUrl is required" });
      }

      const screenshot = await socialSpyService.saveScreenshot(deviceId, childId, imageUrl);
      return res.status(201).json({ success: true, message: "Screen spy snapshot logged", data: screenshot });
    } catch (error) {
      next(error);
    }
  }

  // Parent gets screenshot logs
  async getScreens(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const childId = req.params.childId;
      if (!childId) {
        return res.status(400).json({ success: false, message: "Child ID is required" });
      }

      const data = await socialSpyService.getScreenshots(childId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
export default SocialSpyController;
