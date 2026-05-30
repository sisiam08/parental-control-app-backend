"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.telemetryLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Strict rate limit for authentication (e.g. login, signups)
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per window
    message: {
        success: false,
        message: "Too many authentication requests, please try again after 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Relaxed telemetry limiter for high-volume child device updates
exports.telemetryLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 500, // Limit each device to 500 telemetry payloads per 5 minutes
    message: {
        success: false,
        message: "Device uploading updates too rapidly",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// General dashboard API rate limiter
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: {
        success: false,
        message: "Too many operations, please check back shortly",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
