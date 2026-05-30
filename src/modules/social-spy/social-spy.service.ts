import prisma from "../../config/database";
import { PlatformType } from "@prisma/client";

export class SocialSpyService {
  async saveMessages(deviceId: string, childId: string, messages: Array<{ platform: PlatformType; senderName: string; senderPhone?: string; messageContent: string; messageTime: string }>) {
    const results = [];
    for (const msg of messages) {
      const saved = await prisma.socialMessage.create({
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

  async getMessages(childId: string, platform?: PlatformType) {
    return await prisma.socialMessage.findMany({
      where: {
        childId,
        platform: platform || undefined,
      },
      orderBy: { messageTime: "desc" },
      take: 200,
    });
  }

  async saveScreenshot(deviceId: string, childId: string, imageUrl: string) {
    return await prisma.screenSpy.create({
      data: {
        childId,
        deviceId,
        imageUrl,
      },
    });
  }

  async getScreenshots(childId: string) {
    return await prisma.screenSpy.findMany({
      where: { childId },
      orderBy: { capturedAt: "desc" },
      take: 50,
    });
  }
}
export default SocialSpyService;
