import prisma from "../../config/database";

export class AppUsageService {
  async uploadAppUsages(deviceId: string, childId: string, usages: Array<{ appName: string; packageName: string; durationMinutes: number; lastUsedAt: string }>) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = [];
    for (const item of usages) {
      const usage = await prisma.appUsage.upsert({
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

  async getAppUsages(childId: string, dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    date.setHours(0, 0, 0, 0);

    return await prisma.appUsage.findMany({
      where: { childId, date },
      orderBy: { durationMinutes: "desc" },
    });
  }

  async toggleAppBlock(childId: string, appName: string, packageName: string, isBlocked: boolean, dailyLimitMinutes?: number) {
    return await prisma.appBlock.upsert({
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

  async setScreenTimeLimit(childId: string, dayOfWeek: number, dailyLimitMinutes: number, startTime?: string, endTime?: string, isActive: boolean = true) {
    return await prisma.screenTimeLimit.upsert({
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

  async blockWebsite(childId: string, domain: string, isBlocked: boolean, category?: string) {
    return await prisma.websiteFilter.upsert({
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
export default AppUsageService;
