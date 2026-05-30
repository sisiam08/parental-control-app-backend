import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { ChildrenService } from "./children.service";

const childrenService = new ChildrenService();

export class ChildrenController {
  async enroll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const familyId = req.user?.familyId;
      const { name } = req.body;

      if (!familyId) {
        return res.status(403).json({ success: false, message: "User does not belong to a family group" });
      }
      if (!name) {
        return res.status(400).json({ success: false, message: "Child name is required" });
      }

      const child = await childrenService.enrollChild(familyId, name);

      return res.status(201).json({
        success: true,
        message: "Child registered successfully. Use the code to register companion device.",
        data: child,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const familyId = req.user?.familyId;
      if (!familyId) {
        return res.status(403).json({ success: false, message: "Family identifier required" });
      }
      const children = await childrenService.listChildren(familyId);
      return res.status(200).json({ success: true, data: children });
    } catch (error) {
      next(error);
    }
  }

  async details(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const familyId = req.user?.familyId;
      const childId = req.params.id;

      if (!familyId) {
        return res.status(403).json({ success: false, message: "Family identifier required" });
      }

      const child = await childrenService.getChildDetails(familyId, childId);
      return res.status(200).json({ success: true, data: child });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const familyId = req.user?.familyId;
      const childId = req.params.id;

      if (!familyId) {
        return res.status(403).json({ success: false, message: "Family identifier required" });
      }

      await childrenService.deleteChild(familyId, childId);
      return res.status(200).json({ success: true, message: "Child profile deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
export default ChildrenController;
