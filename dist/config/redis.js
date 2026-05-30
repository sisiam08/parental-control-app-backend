"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.connectRedis = void 0;
const redis_1 = require("redis");
const env_1 = __importDefault(require("./env"));
let isRedisConnected = false;
const inMemoryCache = {};
const redisClient = (0, redis_1.createClient)({
    url: env_1.default.REDIS_URL,
});
redisClient.on("error", (err) => {
    console.warn("⚠️ Redis client connection warning:", err.message);
    isRedisConnected = false;
});
redisClient.on("connect", () => {
    console.log("🔌 Redis connected successfully");
    isRedisConnected = true;
});
const connectRedis = async () => {
    try {
        await redisClient.connect();
    }
    catch (error) {
        console.warn("⚠️ Could not connect to Redis. Falling back to in-memory cache support.");
    }
};
exports.connectRedis = connectRedis;
exports.redis = {
    get: async (key) => {
        if (isRedisConnected) {
            try {
                return await redisClient.get(key);
            }
            catch (err) {
                console.warn("⚠️ Redis GET error:", err);
            }
        }
        return inMemoryCache[key] || null;
    },
    set: async (key, value, expireSeconds) => {
        if (isRedisConnected) {
            try {
                if (expireSeconds) {
                    await redisClient.set(key, value, { EX: expireSeconds });
                }
                else {
                    await redisClient.set(key, value);
                }
                return;
            }
            catch (err) {
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
    del: async (key) => {
        if (isRedisConnected) {
            try {
                await redisClient.del(key);
                return;
            }
            catch (err) {
                console.warn("⚠️ Redis DEL error:", err);
            }
        }
        delete inMemoryCache[key];
    },
    getClient: () => redisClient,
};
exports.default = exports.redis;
