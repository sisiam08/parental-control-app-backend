import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { LocationsService } from "./locations.service";

const locationsService = new LocationsService();

export class LocationsController {
  // Device telemetry coordinate update
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deviceId = req.device?.id;
      const childId = req.device?.childId;
      const { latitude, longitude, accuracy, speed } = req.body;

      if (!deviceId || !childId) {
        return res.status(403).json({ success: false, message: "Device credentials required" });
      }

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ success: false, message: "Latitude and longitude coordinates are required" });
      }

      const location = await locationsService.updateLocation(
        deviceId,
        childId,
        Number(latitude),
        Number(longitude),
        accuracy !== undefined ? Number(accuracy) : undefined,
        speed !== undefined ? Number(speed) : undefined
      );

      return res.status(200).json({ success: true, message: "Coordinates telemetry processed", data: location });
    } catch (error) {
      next(error);
    }
  }

  // Parent query current coordinates
  async latest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const childId = req.params.childId;
      if (!childId) {
        return res.status(400).json({ success: false, message: "Child ID is required" });
      }

      const location = await locationsService.getLatestLocation(childId);
      return res.status(200).json({ success: true, data: location });
    } catch (error) {
      next(error);
    }
  }

  // Parent query historical path
  async history(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const childId = req.params.childId;
      const { startDate, endDate } = req.query;

      if (!childId) {
        return res.status(400).json({ success: false, message: "Child ID is required" });
      }

      const history = await locationsService.getLocationHistory(
        childId,
        startDate as string | undefined,
        endDate as string | undefined
      );

      return res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  // Parent create circular zone
  async createFence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { childId, name, latitude, longitude, radius, type } = req.body;

      if (!childId || !name || latitude === undefined || longitude === undefined || !radius || !type) {
        return res.status(400).json({ success: false, message: "All geofencing parameters (childId, name, coordinates, radius, type) are required" });
      }

      const fence = await locationsService.createGeofence(
        childId,
        name,
        Number(latitude),
        Number(longitude),
        Number(radius),
        type as "SAFE" | "DANGER"
      );

      return res.status(201).json({ success: true, message: "Geofence created successfully", data: fence });
    } catch (error) {
      next(error);
    }
  }

  // Parent list zones
  async listFences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const childId = req.params.childId;
      if (!childId) {
        return res.status(400).json({ success: false, message: "Child ID is required" });
      }

      const fences = await locationsService.listGeofences(childId);
      return res.status(200).json({ success: true, data: fences });
    } catch (error) {
      next(error);
    }
  }

  // Parent delete zone
  async deleteFence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ success: false, message: "Geofence ID is required" });
      }

      await locationsService.deleteGeofence(id);
      return res.status(200).json({ success: true, message: "Geofence deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
export default LocationsController;
