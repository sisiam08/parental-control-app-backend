"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const authService = new auth_service_1.AuthService();
class AuthController {
    async register(req, res, next) {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: "Name, email, and password are required" });
            }
            const data = await authService.registerParent(name, email, password);
            res.cookie("refreshToken", data.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });
            return res.status(201).json({
                success: true,
                message: "Account registered successfully",
                data: {
                    user: data.user,
                    accessToken: data.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Email and password are required" });
            }
            const data = await authService.loginParent(email, password);
            res.cookie("refreshToken", data.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    user: data.user,
                    accessToken: data.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            const token = req.cookies?.refreshToken || req.body?.refreshToken;
            if (!token) {
                return res.status(400).json({ success: false, message: "Refresh token is missing" });
            }
            const data = await authService.refreshToken(token);
            res.cookie("refreshToken", data.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({
                success: true,
                message: "Token rotated successfully",
                data: {
                    accessToken: data.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const token = req.cookies?.refreshToken || req.body?.refreshToken;
            if (token) {
                await authService.logoutParent(token);
            }
            res.clearCookie("refreshToken");
            return res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.default = AuthController;
