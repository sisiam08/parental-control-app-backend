"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialSpyService = void 0;
const database_1 = __importDefault(require("../../config/database"));
class SocialSpyService {
    async saveMessages(deviceId, childId, messages) {
        const results = [];
        for (const msg of messages) {
            const saved = await database_1.default.socialMessage.create({
                data: {
                    childId,
                    deviceId,
                    platform: msg.platform,
                    senderName: msg.senderName,
                    senderPhone: msg.senderPhone || null,
                    messageContent: msg.messageContent,
                    messageTime: new Date(msg.messageTime),
                },
            });
            results.push(saved);
        }
        return results;
    }
    async getMessages(childId, platform) {
        return await database_1.default.socialMessage.findMany({
            where: {
                childId,
                platform: platform || undefined,
            },
            orderBy: { messageTime: "desc" },
            take: 200,
        });
    }
    async saveScreenshot(deviceId, childId, imageUrl) {
        return await database_1.default.screenSpy.create({
            data: {
                childId,
                deviceId,
                imageUrl,
            },
        });
    }
    async getScreenshots(childId) {
        return await database_1.default.screenSpy.findMany({
            where: { childId },
            orderBy: { capturedAt: "desc" },
            take: 50,
        });
    }
}
exports.SocialSpyService = SocialSpyService;
exports.default = SocialSpyService;
