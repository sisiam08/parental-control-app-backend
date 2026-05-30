import http from "http";
import app from "./app";
import env from "./config/env";
import prisma from "./config/database";
import { connectRedis } from "./config/redis";

const server = http.createServer(app);

const startServer = async () => {
  try {
    console.log("🚀 Starting Parental Control server...");

    // Handshake Database connection
    console.log("🔌 Connecting to PostgreSQL...");
    await prisma.$connect();
    console.log("✅ PostgreSQL database connected successfully");

    // Handshake Redis connection (resilient fallback supported)
    console.log("🔌 Connecting to Redis cache...");
    await connectRedis();

    server.listen(env.PORT, () => {
      console.log(`🌐 Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to initialize backend server:", error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    console.log("🧹 Express HTTP server closed.");
    try {
      await prisma.$disconnect();
      console.log("🔌 PostgreSQL connection disconnected.");
      process.exit(0);
    } catch (err) {
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
  // Only exit on truly fatal uncaught exceptions
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  // Log but do NOT exit — Redis reconnect failures are expected
  // when Redis is unavailable; the app has an in-memory fallback.
  console.warn("⚠️ Unhandled Promise Rejection (non-fatal):", reason);
});

startServer();
