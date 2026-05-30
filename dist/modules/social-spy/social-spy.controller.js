"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialSpyController = void 0;
const social_spy_service_1 = require("./social-spy.service");
const socialSpyService = new social_spy_service_1.SocialSpyService();
class SocialSpyController {
    // Device uploading chats
    async uploadMessages(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    // Parent queries chat logs
    async getMessages(req, res, next) {
        try {
            const childId = req.params.childId;
            const { platform } = req.query;
            if (!childId) {
                return res.status(400).json({ success: false, message: "Child ID is required" });
            }
            const data = await socialSpyService.getMessages(childId, platform);
            return res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    // Device uploads screenshot captures
    async uploadScreen(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    // Parent gets screenshot logs
    async getScreens(req, res, next) {
        try {
            const childId = req.params.childId;
            if (!childId) {
                return res.status(400).json({ success: false, message: "Child ID is required" });
            }
            const data = await socialSpyService.getScreenshots(childId);
            return res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SocialSpyController = SocialSpyController;
exports.default = SocialSpyController;
