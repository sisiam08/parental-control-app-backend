import { createClient } from "redis";
import env from "./env";

let isRedisConnected = false;
const inMemoryCache: Record<string, string> = {};

const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    // Stop reconnecting after 3 failed attempts — the in-memory fallback will handle caching
    reconnectStrategy: (retries: number) => {
      if (retries >= 3) {
        console.warn("⚠️ Redis reconnection limit reached. Using in-memory cache.");
        return false as any; // stop reconnecting
      }
      return Math.min(retries * 500, 3000); // 0.5s, 1s, 1.5s backoff
    },
  },
});

redisClient.on("error", (err) => {
  console.warn("⚠️ Redis client connection warning:", err.message);
  isRedisConnected = false;
});

redisClient.on("connect", () => {
  console.log("🔌 Redis connected successfully");
  isRedisConnected = true;
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error: any) {
    console.warn("⚠️ Could not connect to Redis. Falling back to in-memory cache support.");
  }
};

export const redis = {
  get: async (key: string): Promise<string | null> => {
    if (isRedisConnected) {
      try {
        return await redisClient.get(key);
      } catch (err) {
        console.warn("⚠️ Redis GET error:", err);
      }
    }
    return inMemoryCache[key] || null;
  },

  set: async (key: string, value: string, expireSeconds?: number): Promise<void> => {
    if (isRedisConnected) {
      try {
        if (expireSeconds) {
          await redisClient.set(key, value, { EX: expireSeconds });
        } else {
          await redisClient.set(key, value);
        }
        return;
      } catch (err) {
        console.warn("⚠️ Redis SET error:", err);
      }
    }
    inMemoryCache[key] = value;
    if (expireSeconds) {
      setTimeout(() => {
        delete inMemoryCache[key];
      }, expireSeconds * 1000);
    }
  },

  del: async (key: string): Promise<void> => {
    if (isRedisConnected) {
      try {
        await redisClient.del(key);
        return;
      } catch (err) {
        console.warn("⚠️ Redis DEL error:", err);
      }
    }
    delete inMemoryCache[key];
  },

  getClient: () => redisClient,
};

export default redis;
