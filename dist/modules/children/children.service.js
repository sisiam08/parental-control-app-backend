"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildrenService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const globalErrorHandler_1 = require("../../middleware/globalErrorHandler");
class ChildrenService {
    generateRandomPin() {
        return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    }
    async enrollChild(familyId, name) {
        const enrollmentCode = this.generateRandomPin();
        const enrollmentCodeExpiresAt = new Date();
        enrollmentCodeExpiresAt.setHours(enrollmentCodeExpiresAt.getHours() + 24); // 24 hours expiry
        const child = await database_1.default.child.create({
            data: {
                name,
                familyId,
                enrollmentCode,
                enrollmentCodeExpiresAt,
            },
        });
        return child;
    }
    async listChildren(familyId) {
        return await database_1.default.child.findMany({
            where: { familyId },
            include: {
                device: {
                    select: {
                        id: true,
                        deviceName: true,
                        osVersion: true,
                        batteryLevel: true,
                        isLocked: true,
                        stealthMode: true,
                        connectionState: true,
                        lastSeen: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getChildDetails(familyId, childId) {
        const child = await database_1.default.child.findFirst({
            where: { id: childId, familyId },
            include: {
                device: true,
                appBlocks: true,
                screenTimeLimits: true,
                websiteFilters: true,
            },
        });
        if (!child) {
            throw new globalErrorHandler_1.AppError(404, "Child profile not found inside your family");
        }
        return child;
    }
    async deleteChild(familyId, childId) {
        const child = await database_1.default.child.findFirst({
            where: { id: childId, familyId },
        });
        if (!child) {
            throw new globalErrorHandler_1.AppError(404, "Child profile not found");
        }
        await database_1.default.child.delete({
            where: { id: childId },
        });
    }
}
exports.ChildrenService = ChildrenService;
exports.default = ChildrenService;
