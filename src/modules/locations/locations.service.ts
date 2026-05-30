import prisma from "../../config/database";
import redis from "../../config/redis";
import { AppError } from "../../middleware/globalErrorHandler";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // inside meters
}

export class LocationsService {
  async updateLocation(deviceId: string, childId: string, latitude: number, longitude: number, accuracy?: number, speed?: number) {
    // 1. Save coordinate to database
    const location = await prisma.location.create({
      data: {
        childId,
        deviceId,
        latitude,
        longitude,
        accuracy: accuracy || undefined,
        speed: speed || undefined,
      },
    });

    // 2. Cache coordinates in Redis for instant parent dashboard rendering
    const cacheKey = `child:location:${childId}`;
    await redis.set(
      cacheKey,
      JSON.stringify({
        latitude,
        longitude,
        accuracy,
        speed,
        timestamp: new Date().toISOString(),
      }),
      3600
    );

    // 3. Mark device connection active
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        lastSeen: new Date(),
        connectionState: "ONLINE",
      },
    });

    // 4. Geofence violation audit
    const geofences = await prisma.geofence.findMany({
      where: { childId, isActive: true },
    });

    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        family: {
          include: { parents: true },
        },
      },
    });

    if (child && child.family.parents.length > 0) {
      for (const fence of geofences) {
        const distance = calculateDistance(latitude, longitude, fence.latitude, fence.longitude);
        const isInside = distance <= fence.radius;

        let triggered = false;
        let title = "";
        let message = "";

        if (fence.type === "SAFE" && !isInside) {
          triggered = true;
          title = `🚨 Geofence Breach: Left Safe Zone`;
          message = `${child.name} has left their designated safe zone: "${fence.name}".`;
        } else if (fence.type === "DANGER" && isInside) {
          triggered = true;
          title = `⚠️ Geofence Breach: Entered Danger Zone`;
          message = `${child.name} has entered a restricted danger zone: "${fence.name}".`;
        }

        if (triggered) {
          for (const parent of child.family.parents) {
            const alertLockKey = `alert:geofence:${childId}:${fence.id}`;
            const recentAlert = await redis.get(alertLockKey);

            if (!recentAlert) {
              await prisma.notification.create({
                data: {
                  userId: parent.id,
                  type: "GEOFENCE_VIOLATION",
                  title,
                  message,
                  data: {
                    childId,
                    childName: child.name,
                    geofenceId: fence.id,
                    geofenceName: fence.name,
                    latitude,
                    longitude,
                  },
                },
              });

              // Apply 5-minute cool down window
              await redis.set(alertLockKey, "sent", 300);
            }
          }
        }
      }
    }

    return location;
  }

  async getLatestLocation(childId: string) {
    const cached = await redis.get(`child:location:${childId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const latest = await prisma.location.findFirst({
      where: { childId },
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      throw new AppError(404, "No location logs found for this child");
    }

    return latest;
  }

  async getLocationHistory(childId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return await prisma.location.findMany({
      where: {
        childId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async createGeofence(childId: string, name: string, latitude: number, longitude: number, radius: number, type: "SAFE" | "DANGER") {
    return await prisma.geofence.create({
      data: {
        childId,
        name,
        latitude,
        longitude,
        radius,
        type,
      },
    });
  }

  async listGeofences(childId: string) {
    return await prisma.geofence.findMany({
      where: { childId },
    });
  }

  async deleteGeofence(id: string) {
    await prisma.geofence.delete({
      where: { id },
    });
  }
}
export default LocationsService;
