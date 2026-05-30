"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const database_1 = __importDefault(require("./config/database"));
const redis_1 = require("./config/redis");
const server = http_1.default.createServer(app_1.default);
const startServer = async () => {
    try {
        console.log("🚀 Starting Parental Control server...");
        // Handshake Database connection
        console.log("🔌 Connecting to PostgreSQL...");
        await database_1.default.$connect();
        console.log("✅ PostgreSQL database connected successfully");
        // Handshake Redis connection (resilient fallback supported)
        console.log("🔌 Connecting to Redis cache...");
        await (0, redis_1.connectRedis)();
        server.listen(env_1.default.PORT, () => {
            console.log(`🌐 Server is running in ${env_1.default.NODE_ENV} mode on port ${env_1.default.PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to initialize backend server:", error);
        process.exit(1);
    }
};
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        console.log("🧹 Express HTTP server closed.");
        try {
            await database_1.default.$disconnect();
            console.log("🔌 PostgreSQL connection disconnected.");
            process.exit(0);
        }
        catch (err) {
            console.error("❌ Error during PostgreSQL disconnection:", err);
            process.exit(1);
        }
    });
    // Force close after 10s if graceful close hangs
    setTimeout(() => {
        console.error("⏰ Forced shutdown triggered.");
        process.exit(1);
    }, 10000);
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught Exception:", err);
    process.exit(1);
});
process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled Promise Rejection:", reason);
    process.exit(1);
});
startServer();
