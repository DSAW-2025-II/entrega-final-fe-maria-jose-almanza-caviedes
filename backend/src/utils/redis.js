// Centralized Redis client factory for caching and rate-limiting helpers.
import { createClient } from "redis";
import dotenv from "dotenv";

// Ensure environment is loaded before reading REDIS_URL (supports .env usage in dev).
dotenv.config();

// Create a lazy Redis client. We do not auto-connect here to avoid boot coupling;
// services/modules should call connect safely when needed.
export const redis = createClient({
  // Prefer REDIS_URL from env; fallback to local default for developer setups.
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

// Log connection-level errors; do not crash the process since most endpoints can operate without cache.
redis.on("error", (err) => console.error("Redis Error", err));
