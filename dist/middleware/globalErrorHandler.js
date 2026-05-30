"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.AppError = void 0;
const appError_1 = require("../utils/appError");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return appError_1.AppError; } });
const logger_1 = __importDefault(require("../config/logger"));
const globalErrorHandler = (err, _req, res, _next) => {
    const status = err instanceof appError_1.AppError ? err.statusCode : 500;
    const message = err instanceof appError_1.AppError && err.isOperational
        ? err.message
        : process.env.NODE_ENV === "development"
            ? err.message
            : "Something went wrong";
    logger_1.default.error(`${err.constructor.name}: ${err.message}`, {
        stack: err.stack,
        path: _req.originalUrl,
        method: _req.method,
    });
    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
exports.globalErrorHandler = globalErrorHandler;
