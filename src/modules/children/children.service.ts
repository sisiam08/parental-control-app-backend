import prisma from "../../config/database";
import { AppError } from "../../middleware/globalErrorHandler";

export class ChildrenService {
  private generateRandomPin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  }

  async enrollChild(familyId: string, name: string) {
    const enrollmentCode = this.generateRandomPin();
    const enrollmentCodeExpiresAt = new Date();
    enrollmentCodeExpiresAt.setHours(enrollmentCodeExpiresAt.getHours() + 24); // 24 hours expiry

    const child = await prisma.child.create({
      data: {
        name,
        familyId,
        enrollmentCode,
        enrollmentCodeExpiresAt,
      },
    });

    return child;
  }

  async listChildren(familyId: string) {
    return await prisma.child.findMany({
      where: { familyId },
      include: {
        device: {
          select: {
            id: true,
            deviceName: true,
            osVersion: true,
            batteryLevel: true,
            isLocked: true,
            stealthMode: true,
            connectionState: true,
            lastSeen: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getChildDetails(familyId: string, childId: string) {
    const child = await prisma.child.findFirst({
      where: { id: childId, familyId },
      include: {
        device: true,
        appBlocks: true,
        screenTimeLimits: true,
        websiteFilters: true,
      },
    });

    if (!child) {
      throw new AppError(404, "Child profile not found inside your family");
    }

    return child;
  }

  async deleteChild(familyId: string, childId: string) {
    const child = await prisma.child.findFirst({
      where: { id: childId, familyId },
    });

    if (!child) {
      throw new AppError(404, "Child profile not found");
    }

    await prisma.child.delete({
      where: { id: childId },
    });
  }
}
export default ChildrenService;
