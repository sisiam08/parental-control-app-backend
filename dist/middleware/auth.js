"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateDevice = exports.authenticateParent = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const database_1 = __importDefault(require("../config/database"));
const globalErrorHandler_1 = require("./globalErrorHandler");
const authenticateParent = async (req, _res, next) => {
    try {
        let token = "";
        if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }
        else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            throw new globalErrorHandler_1.AppError(401, "Authentication credentials required");
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_ACCESS_SECRET);
        const user = await database_1.default.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, familyId: true },
        });
        if (!user) {
            throw new globalErrorHandler_1.AppError(401, "User associated with this token not found");
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(new globalErrorHandler_1.AppError(401, "Invalid or expired access token"));
    }
};
exports.authenticateParent = authenticateParent;
const authenticateDevice = async (req, _res, next) => {
    try {
        let deviceToken = req.headers["x-device-token"];
        if (!deviceToken && req.headers.authorization?.startsWith("Bearer ")) {
            deviceToken = req.headers.authorization.split(" ")[1];
        }
        if (!deviceToken) {
            throw new globalErrorHandler_1.AppError(401, "Companion device authorization required");
        }
        const device = await database_1.default.device.findUnique({
            where: { deviceToken },
            select: { id: true, childId: true, deviceName: true },
        });
        if (!device) {
            throw new globalErrorHandler_1.AppError(401, "Unregistered or invalid device token");
        }
        req.device = device;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticateDevice = authenticateDevice;
