"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const globalErrorHandler_1 = require("../../middleware/globalErrorHandler");
class NotificationsService {
    async triggerSOS(_deviceId, childId, latitude, longitude) {
        // 1. Create active EmergencySOS record
        const sos = await database_1.default.emergencySOS.create({
            data: {
                childId,
                latitude: latitude || undefined,
                longitude: longitude || undefined,
                status: "ACTIVE",
            },
        });
        // 2. Query parents in family to dispatch notifications
        const child = await database_1.default.child.findUnique({
            where: { id: childId },
            include: {
                family: {
                    include: { parents: true },
                },
            },
        });
        if (child && child.family.parents.length > 0) {
            for (const parent of child.family.parents) {
                await database_1.default.notification.create({
                    data: {
                        userId: parent.id,
                        type: "SOS_TRIGGERED",
                        title: `🚨 EMERGENCY SOS: ${child.name}`,
                        message: `${child.name} has triggered a panic SOS alarm! Immediate attention required.`,
                        data: {
                            childId,
                            childName: child.name,
                            sosId: sos.id,
                            latitude,
                            longitude,
                        },
                    },
                });
            }
        }
        return sos;
    }
    async resolveSOS(childId, parentId) {
        const activeSos = await database_1.default.emergencySOS.findFirst({
            where: { childId, status: "ACTIVE" },
        });
        if (!activeSos) {
            throw new globalErrorHandler_1.AppError(400, "No active SOS alarm found for this child");
        }
        return await database_1.default.emergencySOS.update({
            where: { id: activeSos.id },
            data: {
                status: "RESOLVED",
                resolvedAt: new Date(),
                resolvedBy: parentId,
            },
        });
    }
    async getAlerts(userId) {
        return await database_1.default.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    }
    async markAsRead(id, userId) {
        return await database_1.default.notification.update({
            where: { id, userId },
            data: { isRead: true },
        });
    }
    // Interactive Check-Ins
    async requestCheckIn(childId, parentId, message) {
        const child = await database_1.default.child.findUnique({
            where: { id: childId },
            include: { device: true },
        });
        if (!child || !child.device) {
            throw new globalErrorHandler_1.AppError(404, "Child companion device not active or found");
        }
        const checkIn = await database_1.default.checkInRequest.create({
            data: {
                childId,
                parentId,
                message,
                status: "PENDING",
            },
        });
        // Queue command for child device to trigger response
        await database_1.default.deviceCommand.create({
            data: {
                deviceId: child.device.id,
                commandType: "CHECK_IN",
                payload: { checkInId: checkIn.id, message },
                status: "PENDING",
            },
        });
        return checkIn;
    }
    async respondCheckIn(_deviceId, checkInId, latitude, longitude) {
        const checkIn = await database_1.default.checkInRequest.findUnique({
            where: { id: checkInId },
        });
        if (!checkIn) {
            throw new globalErrorHandler_1.AppError(404, "Check-in request not found");
        }
        return await database_1.default.checkInRequest.update({
            where: { id: checkInId },
            data: {
                status: "RESPONDED",
                latitude: latitude || undefined,
                longitude: longitude || undefined,
                respondedAt: new Date(),
            },
        });
    }
}
exports.NotificationsService = NotificationsService;
exports.default = NotificationsService;
