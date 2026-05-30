"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationsService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const redis_1 = __importDefault(require("../../config/redis"));
const globalErrorHandler_1 = require("../../middleware/globalErrorHandler");
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // inside meters
}
class LocationsService {
    async updateLocation(deviceId, childId, latitude, longitude, accuracy, speed) {
        // 1. Save coordinate to database
        const location = await database_1.default.location.create({
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
        await redis_1.default.set(cacheKey, JSON.stringify({
            latitude,
            longitude,
            accuracy,
            speed,
            timestamp: new Date().toISOString(),
        }), 3600);
        // 3. Mark device connection active
        await database_1.default.device.update({
            where: { id: deviceId },
            data: {
                lastSeen: new Date(),
                connectionState: "ONLINE",
            },
        });
        // 4. Geofence violation audit
        const geofences = await database_1.default.geofence.findMany({
            where: { childId, isActive: true },
        });
        const child = await database_1.default.child.findUnique({
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
                }
                else if (fence.type === "DANGER" && isInside) {
                    triggered = true;
                    title = `⚠️ Geofence Breach: Entered Danger Zone`;
                    message = `${child.name} has entered a restricted danger zone: "${fence.name}".`;
                }
                if (triggered) {
                    for (const parent of child.family.parents) {
                        const alertLockKey = `alert:geofence:${childId}:${fence.id}`;
                        const recentAlert = await redis_1.default.get(alertLockKey);
                        if (!recentAlert) {
                            await database_1.default.notification.create({
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
                            await redis_1.default.set(alertLockKey, "sent", 300);
                        }
                    }
                }
            }
        }
        return location;
    }
    async getLatestLocation(childId) {
        const cached = await redis_1.default.get(`child:location:${childId}`);
        if (cached) {
            return JSON.parse(cached);
        }
        const latest = await database_1.default.location.findFirst({
            where: { childId },
            orderBy: { createdAt: "desc" },
        });
        if (!latest) {
            throw new globalErrorHandler_1.AppError(404, "No location logs found for this child");
        }
        return latest;
    }
    async getLocationHistory(childId, startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        return await database_1.default.location.findMany({
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
    async createGeofence(childId, name, latitude, longitude, radius, type) {
        return await database_1.default.geofence.create({
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
    async listGeofences(childId) {
        return await database_1.default.geofence.findMany({
            where: { childId },
        });
    }
    async deleteGeofence(id) {
        await database_1.default.geofence.delete({
            where: { id },
        });
    }
}
exports.LocationsService = LocationsService;
exports.default = LocationsService;
