"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../../config/database"));
const env_1 = __importDefault(require("../../config/env"));
const globalErrorHandler_1 = require("../../middleware/globalErrorHandler");
class AuthService {
    generateTokens(payload) {
        const accessToken = jsonwebtoken_1.default.sign(payload, env_1.default.JWT_ACCESS_SECRET, {
            expiresIn: env_1.default.JWT_ACCESS_EXPIRES_IN,
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.default.JWT_REFRESH_SECRET, {
            expiresIn: env_1.default.JWT_REFRESH_EXPIRES_IN,
        });
        return { accessToken, refreshToken };
    }
    async registerParent(name, email, password) {
        const existing = await database_1.default.user.findUnique({ where: { email } });
        if (existing) {
            throw new globalErrorHandler_1.AppError(400, "A user with this email address already exists");
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Run in transaction: Create Family, then create User
        const result = await database_1.default.$transaction(async (tx) => {
            const family = await tx.family.create({
                data: {
                    name: `${name}'s Family`,
                },
            });
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    role: "PARENT",
                    familyId: family.id,
                },
            });
            return { user, family };
        });
        const tokens = this.generateTokens({
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            familyId: result.user.familyId,
        });
        // Create session record
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
        await database_1.default.session.create({
            data: {
                userId: result.user.id,
                refreshToken: tokens.refreshToken,
                expiresAt,
            },
        });
        // Write audit log
        await database_1.default.auditLog.create({
            data: {
                userId: result.user.id,
                action: "REGISTER",
                details: "Parent user registered and default family created",
            },
        });
        return {
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
                familyId: result.user.familyId,
            },
            ...tokens,
        };
    }
    async loginParent(email, password) {
        const user = await database_1.default.user.findUnique({
            where: { email },
            include: { family: true },
        });
        if (!user) {
            throw new globalErrorHandler_1.AppError(401, "Invalid email address or password");
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new globalErrorHandler_1.AppError(401, "Invalid email address or password");
        }
        const tokens = this.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
            familyId: user.familyId,
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await database_1.default.session.create({
            data: {
                userId: user.id,
                refreshToken: tokens.refreshToken,
                expiresAt,
            },
        });
        await database_1.default.auditLog.create({
            data: {
                userId: user.id,
                action: "LOGIN",
                details: "Parent user logged in successfully",
            },
        });
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                familyId: user.familyId,
            },
            ...tokens,
        };
    }
    async refreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_REFRESH_SECRET);
            const session = await database_1.default.session.findUnique({
                where: { refreshToken: token },
            });
            if (!session || !session.isActive || session.expiresAt < new Date()) {
                throw new globalErrorHandler_1.AppError(401, "Invalid or expired session refresh token");
            }
            // Generate rotated pair
            const tokens = this.generateTokens({
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                familyId: decoded.familyId,
            });
            // Update current session with rotated token
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);
            await database_1.default.session.update({
                where: { id: session.id },
                data: {
                    refreshToken: tokens.refreshToken,
                    expiresAt,
                },
            });
            return tokens;
        }
        catch (err) {
            throw new globalErrorHandler_1.AppError(401, "Refresh token verification failed");
        }
    }
    async logoutParent(token) {
        await database_1.default.session.updateMany({
            where: { refreshToken: token },
            data: { isActive: false },
        });
    }
}
exports.AuthService = AuthService;
