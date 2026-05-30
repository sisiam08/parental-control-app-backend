"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = __importDefault(require("../../config/database"));
const globalErrorHandler_1 = require("../../middleware/globalErrorHandler");
class DevicesService {
    async registerDevice(enrollmentCode, deviceName, osVersion, appVersion) {
        const child = await database_1.default.child.findUnique({
            where: { enrollmentCode },
        });
        if (!child) {
            throw new globalErrorHandler_1.AppError(400, "Invalid or expired enrollment code");
        }
        if (child.enrollmentCodeExpiresAt && child.enrollmentCodeExpiresAt < new Date()) {
            throw new globalErrorHandler_1.AppError(400, "Enrollment code has expired");
        }
        // Generate secure device token
        const deviceToken = crypto_1.default.randomBytes(32).toString("hex");
        // Create or update device
        const device = await database_1.default.device.upsert({
            where: { childId: child.id },
            update: {
                deviceName,
                osVersion,
                appVersion,
                deviceToken,
                connectionState: "ONLINE",
                lastSeen: new Date(),
            },
            create: {
                childId: child.id,
                deviceName,
                osVersion,
                appVersion,
                deviceToken,
                connectionState: "ONLINE",
                lastSeen: new Date(),
            },
        });
        // Mark enrollment code as consumed
        await database_1.default.child.update({
            where: { id: child.id },
            data: {
                enrollmentCode: null,
                enrollmentCodeExpiresAt: null,
            },
        });
        return device;
    }
    async updateHealth(deviceId, batteryLevel, stealthMode, isLocked) {
        return await database_1.default.device.update({
            where: { id: deviceId },
            data: {
                batteryLevel,
                stealthMode,
                isLocked: isLocked !== undefined ? isLocked : undefined,
                connectionState: "ONLINE",
                lastSeen: new Date(),
            },
        });
    }
    async queueCommand(deviceId, commandType, payload) {
        const command = await database_1.default.deviceCommand.create({
            data: {
                deviceId,
                commandType,
                payload: payload || undefined,
                status: "PENDING",
            },
        });
        return command;
    }
    async getPendingCommands(deviceId) {
        const commands = await database_1.default.deviceCommand.findMany({
            where: { deviceId, status: "PENDING" },
        });
        if (commands.length > 0) {
            await database_1.default.deviceCommand.updateMany({
                where: { id: { in: commands.map((c) => c.id) } },
                data: { status: "SENT" },
            });
        }
        return commands;
    }
    async respondToCommand(deviceId, commandId, status, _outputPayload) {
        const command = await database_1.default.deviceCommand.findFirst({
            where: { id: commandId, deviceId },
        });
        if (!command) {
            throw new globalErrorHandler_1.AppError(404, "Device command not found");
        }
        const updatedCommand = await database_1.default.deviceCommand.update({
            where: { id: commandId },
            data: {
                status,
                updatedAt: new Date(),
            },
        });
        // If command was executed successfully, adjust device states accordingly
        if (status === "EXECUTED") {
            if (command.commandType === "LOCK") {
                await database_1.default.device.update({
                    where: { id: deviceId },
                    data: { isLocked: true },
                });
            }
            else if (command.commandType === "UNLOCK") {
                await database_1.default.device.update({
                    where: { id: deviceId },
                    data: { isLocked: false },
                });
            }
        }
        return updatedCommand;
    }
}
exports.DevicesService = DevicesService;
exports.default = DevicesService;
