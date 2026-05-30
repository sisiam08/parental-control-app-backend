"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppUsageService = void 0;
const database_1 = __importDefault(require("../../config/database"));
class AppUsageService {
    async uploadAppUsages(deviceId, childId, usages) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const results = [];
        for (const item of usages) {
            const usage = await database_1.default.appUsage.upsert({
                where: {
                    childId_packageName_date: {
                        childId,
                        packageName: item.packageName,
                        date: today,
                    },
                },
                update: {
                    durationMinutes: item.durationMinutes,
                    lastUsedAt: new Date(item.lastUsedAt),
                },
                create: {
                    childId,
                    deviceId,
                    appName: item.appName,
                    packageName: item.packageName,
                    durationMinutes: item.durationMinutes,
                    date: today,
                    lastUsedAt: new Date(item.lastUsedAt),
                },
            });
            results.push(usage);
        }
        return results;
    }
    async getAppUsages(childId, dateStr) {
        const date = dateStr ? new Date(dateStr) : new Date();
        date.setHours(0, 0, 0, 0);
        return await database_1.default.appUsage.findMany({
            where: { childId, date },
            orderBy: { durationMinutes: "desc" },
        });
    }
    async toggleAppBlock(childId, appName, packageName, isBlocked, dailyLimitMinutes) {
        return await database_1.default.appBlock.upsert({
            where: {
                childId_packageName: {
                    childId,
                    packageName,
                },
            },
            update: {
                isBlocked,
                dailyLimitMinutes: dailyLimitMinutes !== undefined ? dailyLimitMinutes : null,
            },
            create: {
                childId,
                appName,
                packageName,
                isBlocked,
                dailyLimitMinutes,
            },
        });
    }
    async setScreenTimeLimit(childId, dayOfWeek, dailyLimitMinutes, startTime, endTime, isActive = true) {
        return await database_1.default.screenTimeLimit.upsert({
            where: {
                childId_dayOfWeek: {
                    childId,
                    dayOfWeek,
                },
            },
            update: {
                dailyLimitMinutes,
                startTime: startTime || null,
                endTime: endTime || null,
                isActive,
            },
            create: {
                childId,
                dayOfWeek,
                dailyLimitMinutes,
                startTime,
                endTime,
                isActive,
            },
        });
    }
    async blockWebsite(childId, domain, isBlocked, category) {
        return await database_1.default.websiteFilter.upsert({
            where: {
                childId_domain: {
                    childId,
                    domain,
                },
            },
            update: {
                isBlocked,
                category: category || null,
            },
            create: {
                childId,
                domain,
                isBlocked,
                category,
            },
        });
    }
}
exports.AppUsageService = AppUsageService;
exports.default = AppUsageService;
