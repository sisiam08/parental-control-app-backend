"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeofenceService = void 0;
const database_1 = require("../../config/database");
const globalErrorHandler_1 = require("../../middleware/globalErrorHandler");
class GeofenceService {
    async getAll(childId) {
        return database_1.prisma.geofence.findMany({ where: { childId } });
    }
    async getById(childId, id) {
        const geofence = await database_1.prisma.geofence.findFirst({ where: { id, childId } });
        if (!geofence)
            throw new globalErrorHandler_1.AppError(404, "Geofence not found");
        return geofence;
    }
    async create(childId, data) {
        return database_1.prisma.geofence.create({ data: { ...data, childId } });
    }
    async update(childId, id, data) {
        const existing = await database_1.prisma.geofence.findFirst({ where: { id, childId } });
        if (!existing)
            throw new globalErrorHandler_1.AppError(404, "Geofence not found");
        return database_1.prisma.geofence.update({ where: { id }, data });
    }
    async delete(childId, id) {
        const existing = await database_1.prisma.geofence.findFirst({ where: { id, childId } });
        if (!existing)
            throw new globalErrorHandler_1.AppError(404, "Geofence not found");
        return database_1.prisma.geofence.delete({ where: { id } });
    }
}
exports.GeofenceService = GeofenceService;
