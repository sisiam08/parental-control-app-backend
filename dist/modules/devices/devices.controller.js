"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesController = void 0;
const devices_service_1 = require("./devices.service");
const database_1 = __importDefault(require("../../config/database"));
const devicesService = new devices_service_1.DevicesService();
class DevicesController {
    // Companion Device Signup
    async register(req, res, next) {
        try {
            const { enrollmentCode, deviceName, osVersion, appVersion } = req.body;
            if (!enrollmentCode || !deviceName || !osVersion) {
                return res.status(400).json({ success: false, message: "Enrollment code, device name, and OS details are required" });
            }
            const device = await devicesService.registerDevice(enrollmentCode, deviceName, osVersion, appVersion);
            return res.status(200).json({
                success: true,
                message: "Device enrolled successfully",
                data: {
                    id: device.id,
                    deviceName: device.deviceName,
                    deviceToken: device.deviceToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Device Telemetry Health Check
    async health(req, res, next) {
        try {
            const deviceId = req.device?.id;
            const { batteryLevel, stealthMode, isLocked } = req.body;
            if (!deviceId) {
                return res.status(403).json({ success: false, message: "Device authentication failed" });
            }
            await devicesService.updateHealth(deviceId, Number(batteryLevel ?? 100), Boolean(stealthMode), isLocked !== undefined ? Boolean(isLocked) : undefined);
            return res.status(200).json({ success: true, message: "Telemetry health updated" });
        }
        catch (error) {
            next(error);
        }
    }
    // Device Commands Fetch (Long Poll)
    async getCommands(req, res, next) {
        try {
            const deviceId = req.device?.id;
            if (!deviceId) {
                return res.status(403).json({ success: false, message: "Device authentication failed" });
            }
            const commands = await devicesService.getPendingCommands(deviceId);
            return res.status(200).json({ success: true, data: commands });
        }
        catch (error) {
            next(error);
        }
    }
    // Device command respond
    async respondToCommand(req, res, next) {
        try {
            const deviceId = req.device?.id;
            const commandId = req.params.id;
            const { status, payload } = req.body;
            if (!deviceId) {
                return res.status(403).json({ success: false, message: "Device authentication failed" });
            }
            if (!status || !["EXECUTED", "FAILED"].includes(status)) {
                return res.status(400).json({ success: false, message: "Valid response status is required" });
            }
            const command = await devicesService.respondToCommand(deviceId, commandId, status, payload);
            return res.status(200).json({ success: true, data: command });
        }
        catch (error) {
            next(error);
        }
    }
    // Remote locks triggered by Parents on Web Dashboard
    async remoteLock(req, res, next) {
        try {
            const familyId = req.user?.familyId;
            const { childId, action } = req.body; // action: 'LOCK' or 'UNLOCK'
            if (!familyId) {
                return res.status(403).json({ success: false, message: "Parent credentials required" });
            }
            if (!childId || !["LOCK", "UNLOCK"].includes(action)) {
                return res.status(400).json({ success: false, message: "Valid child ID and action (LOCK/UNLOCK) are required" });
            }
            const child = await database_1.default.child.findFirst({
                where: { id: childId, familyId },
                include: { device: true },
            });
            if (!child || !child.device) {
                return res.status(404).json({ success: false, message: "Child device not found inside family" });
            }
            const command = await devicesService.queueCommand(child.device.id, action);
            return res.status(200).json({
                success: true,
                message: `Remote lock command ${action} queued successfully`,
                data: command,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DevicesController = DevicesController;
exports.default = DevicesController;
