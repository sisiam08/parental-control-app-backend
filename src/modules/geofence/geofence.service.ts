import { prisma } from "../../config/database";
import { AppError } from "../../middleware/globalErrorHandler";
import { FenceType } from "@prisma/client";

export class GeofenceService {
  async getAll(childId: string) {
    return prisma.geofence.findMany({ where: { childId } });
  }

  async getById(childId: string, id: string) {
    const geofence = await prisma.geofence.findFirst({ where: { id, childId } });
    if (!geofence) throw new AppError(404, "Geofence not found");
    return geofence;
  }

  async create(childId: string, data: {
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    type: FenceType;
  }) {
    return prisma.geofence.create({ data: { ...data, childId } });
  }

  async update(childId: string, id: string, data: Partial<{
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    type: FenceType;
    isActive: boolean;
  }>) {
    const existing = await prisma.geofence.findFirst({ where: { id, childId } });
    if (!existing) throw new AppError(404, "Geofence not found");
    return prisma.geofence.update({ where: { id }, data });
  }

  async delete(childId: string, id: string) {
    const existing = await prisma.geofence.findFirst({ where: { id, childId } });
    if (!existing) throw new AppError(404, "Geofence not found");
    return prisma.geofence.delete({ where: { id } });
  }
}
