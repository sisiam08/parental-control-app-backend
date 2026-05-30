"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppUsageController = void 0;
const app_usage_service_1 = require("./app-usage.service");
const appUsageService = new app_usage_service_1.AppUsageService();
class AppUsageController {
    // Device uploading usages
    async upload(req, res, next) {
        try {
            const deviceId = req.device?.id;
            const childId = req.device?.childId;
            const { usages } = req.body;
            if (!deviceId || !childId) {
                return res.status(403).json({ success: false, message: "Device credentials required" });
            }
            if (!usages || !Array.isArray(usages)) {
                return res.status(400).json({ success: false, message: "Usages must be a valid array" });
            }
            const data = await appUsageService.uploadAppUsages(deviceId, childId, usages);
            return res.status(200).json({ success: true, message: "App usages updated successfully", data });
        }
        catch (error) {
            next(error);
        }
    }
    // Parent queries child's daily app usages
    async getUsage(req, res, next) {
        try {
            const childId = req.params.childId;
            const { date } = req.query;
            if (!childId) {
                return res.status(400).json({ success: false, message: "Child ID is required" });
            }
            const usages = await appUsageService.getAppUsages(childId, date);
            return res.status(200).json({ success: true, data: usages });
        }
        catch (error) {
            next(error);
        }
    }
    // Parent toggles app package blocks
    async toggleBlock(req, res, next) {
        try {
            const childId = req.params.childId;
            const { appName, packageName, isBlocked, dailyLimitMinutes } = req.body;
            if (!childId || !appName || !packageName || isBlocked === undefined) {
                return res.status(400).json({ success: false, message: "childId, appName, packageName, and isBlocked are required" });
            }
            const block = await appUsageService.toggleAppBlock(childId, appName, packageName, Boolean(isBlocked), dailyLimitMinutes !== undefined ? Number(dailyLimitMinutes) : undefined);
            return res.status(200).json({ success: true, message: "App block updated successfully", data: block });
        }
        catch (error) {
            next(error);
        }
    }
    // Parent defines screen daily limits
    async setLimit(req, res, next) {
        try {
            const childId = req.params.childId;
            const { dayOfWeek, dailyLimitMinutes, startTime, endTime, isActive } = req.body;
            if (!childId || dayOfWeek === undefined || dailyLimitMinutes === undefined) {
                return res.status(400).json({ success: false, message: "childId, dayOfWeek, and dailyLimitMinutes are required" });
            }
            const limit = await appUsageService.setScreenTimeLimit(childId, Number(dayOfWeek), Number(dailyLimitMinutes), startTime, endTime, isActive !== undefined ? Boolean(isActive) : true);
            return res.status(200).json({ success: true, message: "Screen time limit set successfully", data: limit });
        }
        catch (error) {
            next(error);
        }
    }
    // Parent configures website filters
    async filterDomain(req, res, next) {
        try {
            const childId = req.params.childId;
            const { domain, isBlocked, category } = req.body;
            if (!childId || !domain || isBlocked === undefined) {
                return res.status(400).json({ success: false, message: "childId, domain, and isBlocked are required" });
            }
            const filter = await appUsageService.blockWebsite(childId, domain, Boolean(isBlocked), category);
            return res.status(200).json({ success: true, message: "Website filter configured successfully", data: filter });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AppUsageController = AppUsageController;
exports.default = AppUsageController;
