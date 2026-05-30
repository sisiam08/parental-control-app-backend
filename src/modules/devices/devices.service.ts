import crypto from "crypto";
import prisma from "../../config/database";
import { AppError } from "../../middleware/globalErrorHandler";
import { DeviceCommandType } from "@prisma/client";

export class DevicesService {
  async registerDevice(enrollmentCode: string, deviceName: string, osVersion: string, appVersion?: string) {
    const child = await prisma.child.findUnique({
      where: { enrollmentCode },
    });

    if (!child) {
      throw new AppError(400, "Invalid or expired enrollment code");
    }

    if (child.enrollmentCodeExpiresAt && child.enrollmentCodeExpiresAt < new Date()) {
      throw new AppError(400, "Enrollment code has expired");
    }

    // Generate secure device token
    const deviceToken = crypto.randomBytes(32).toString("hex");

    // Create or update device
    const device = await prisma.device.upsert({
      where: { childId: child.id },
      update: {
        deviceName,
        osVersion,
        appVersion,
        deviceToken,
        connectionState: "ONLINE",
        lastSeen: new Date(),
      },
      create: {
        childId: child.id,
        deviceName,
        osVersion,
        appVersion,
        deviceToken,
        connectionState: "ONLINE",
        lastSeen: new Date(),
      },
    });

    // Mark enrollment code as consumed
    await prisma.child.update({
      where: { id: child.id },
      data: {
        enrollmentCode: null,
        enrollmentCodeExpiresAt: null,
      },
    });

    return device;
  }

  async updateHealth(deviceId: string, batteryLevel: number, stealthMode: boolean, isLocked?: boolean) {
    return await prisma.device.update({
      where: { id: deviceId },
      data: {
        batteryLevel,
        stealthMode,
        isLocked: isLocked !== undefined ? isLocked : undefined,
        connectionState: "ONLINE",
        lastSeen: new Date(),
      },
    });
  }

  async queueCommand(deviceId: string, commandType: DeviceCommandType, payload?: any) {
    const command = await prisma.deviceCommand.create({
      data: {
        deviceId,
        commandType,
        payload: payload || undefined,
        status: "PENDING",
      },
    });
    return command;
  }

  async getPendingCommands(deviceId: string) {
    const commands = await prisma.deviceCommand.findMany({
      where: { deviceId, status: "PENDING" },
    });

    if (commands.length > 0) {
      await prisma.deviceCommand.updateMany({
        where: { id: { in: commands.map((c: any) => c.id) } },
        data: { status: "SENT" },
      });
    }

    return commands;
  }

  async respondToCommand(deviceId: string, commandId: string, status: "EXECUTED" | "FAILED", _outputPayload?: any) {
    const command = await prisma.deviceCommand.findFirst({
      where: { id: commandId, deviceId },
    });

    if (!command) {
      throw new AppError(404, "Device command not found");
    }

    const updatedCommand = await prisma.deviceCommand.update({
      where: { id: commandId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // If command was executed successfully, adjust device states accordingly
    if (status === "EXECUTED") {
      if (command.commandType === "LOCK") {
        await prisma.device.update({
          where: { id: deviceId },
          data: { isLocked: true },
        });
      } else if (command.commandType === "UNLOCK") {
        await prisma.device.update({
          where: { id: deviceId },
          data: { isLocked: false },
        });
      }
    }

    return updatedCommand;
  }
}
export default DevicesService;
