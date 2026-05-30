"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes"));
const notFound_1 = require("./middleware/notFound");
const globalErrorHandler_1 = require("./middleware/globalErrorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true, // Allow dashboard clients to exchange credentials dynamically
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "10mb" })); // Extra buffer capacity for screen spy telemetry uploads
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// General limit applied to standard API requests
app.use("/api/v1", rateLimiter_1.apiLimiter);
// Mount core parental control routes
app.use("/api/v1", routes_1.default);
// Handle unknown route 404s
app.use(notFound_1.notFound);
// Standardized error pipeline
app.use(globalErrorHandler_1.globalErrorHandler);
exports.default = app;
