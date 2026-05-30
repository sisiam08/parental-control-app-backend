import prisma from "../../config/database";
import { AppError } from "../../middleware/globalErrorHandler";

export class NotificationsService {
  async triggerSOS(_deviceId: string, childId: string, latitude?: number, longitude?: number) {
    // 1. Create active EmergencySOS record
    const sos = await prisma.emergencySOS.create({
      data: {
        childId,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        status: "ACTIVE",
      },
    });

    // 2. Query parents in family to dispatch notifications
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        family: {
          include: { parents: true },
        },
      },
    });

    if (child && child.family.parents.length > 0) {
      for (const parent of child.family.parents) {
        await prisma.notification.create({
          data: {
            userId: parent.id,
            type: "SOS_TRIGGERED",
            title: `🚨 EMERGENCY SOS: ${child.name}`,
            message: `${child.name} has triggered a panic SOS alarm! Immediate attention required.`,
            data: {
              childId,
              childName: child.name,
              sosId: sos.id,
              latitude,
              longitude,
            },
          },
        });
      }
    }

    return sos;
  }

  async resolveSOS(childId: string, parentId: string) {
    const activeSos = await prisma.emergencySOS.findFirst({
      where: { childId, status: "ACTIVE" },
    });

    if (!activeSos) {
      throw new AppError(400, "No active SOS alarm found for this child");
    }

    return await prisma.emergencySOS.update({
      where: { id: activeSos.id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: parentId,
      },
    });
  }

  async getAlerts(userId: string) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async markAsRead(id: string, userId: string) {
    return await prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  // Interactive Check-Ins
  async requestCheckIn(childId: string, parentId: string, message: string) {
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: { device: true },
    });

    if (!child || !child.device) {
      throw new AppError(404, "Child companion device not active or found");
    }

    const checkIn = await prisma.checkInRequest.create({
      data: {
        childId,
        parentId,
        message,
        status: "PENDING",
      },
    });

    // Queue command for child device to trigger response
    await prisma.deviceCommand.create({
      data: {
        deviceId: child.device.id,
        commandType: "CHECK_IN",
        payload: { checkInId: checkIn.id, message },
        status: "PENDING",
      },
    });

    return checkIn;
  }

  async respondCheckIn(_deviceId: string, checkInId: string, latitude?: number, longitude?: number) {
    const checkIn = await prisma.checkInRequest.findUnique({
      where: { id: checkInId },
    });

    if (!checkIn) {
      throw new AppError(404, "Check-in request not found");
    }

    return await prisma.checkInRequest.update({
      where: { id: checkInId },
      data: {
        status: "RESPONDED",
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        respondedAt: new Date(),
      },
    });
  }
}
export default NotificationsService;
