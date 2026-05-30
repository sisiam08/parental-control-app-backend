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

  async generateMockData(childId: string) {
    // Find a device for this child
    const device = await prisma.device.findFirst({
      where: { childId },
    });
    const deviceId = device?.id || "mock-device-id";

    // Create 4 mock social messages
    const msgTime = new Date();
    const messages = [
      {
        childId,
        deviceId,
        platform: "WHATSAPP" as PlatformType,
        senderName: "Sophia (Classmate)",
        senderPhone: "+15550244",
        messageContent: "Hey, did you get the notes for the history project?",
        messageTime: new Date(msgTime.getTime() - 15 * 60 * 1000),
      },
      {
        childId,
        deviceId,
        platform: "WHATSAPP" as PlatformType,
        senderName: "Your Child",
        messageContent: "Yeah! I'll email them to you in a few minutes.",
        messageTime: new Date(msgTime.getTime() - 12 * 60 * 1000),
      },
      {
        childId,
        deviceId,
        platform: "TELEGRAM" as PlatformType,
        senderName: "GamingBot",
        messageContent: "Your daily reward is ready! Claim now.",
        messageTime: new Date(msgTime.getTime() - 5 * 60 * 1000),
      },
      {
        childId,
        deviceId,
        platform: "MESSENGER" as PlatformType,
        senderName: "Uncle David",
        messageContent: "Merry Christmas! Hope you have a wonderful break.",
        messageTime: new Date(msgTime.getTime() - 2 * 60 * 60 * 1000),
      },
    ];

    // Bulk create messages
    for (const msg of messages) {
      await prisma.socialMessage.create({
        data: msg,
      });
    }

    // Create 2 mock screenshots
    const screens = [
      {
        childId,
        deviceId,
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
        capturedAt: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        childId,
        deviceId,
        imageUrl: "https://images.unsplash.com/photo-1608111283390-2e333b9b279c?auto=format&fit=crop&w=600&q=80",
        capturedAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ];

    // Bulk create screen captures
    for (const screen of screens) {
      await prisma.screenSpy.create({
        data: screen,
      });
    }

    return { messagesCount: messages.length, screensCount: screens.length };
  }
}
export default SocialSpyService;
