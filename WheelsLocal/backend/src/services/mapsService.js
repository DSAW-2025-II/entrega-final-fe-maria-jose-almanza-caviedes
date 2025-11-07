// Google Distance Matrix integration with optional Redis caching to reduce latency and quota usage.
import axios from "axios";
import { redis } from "../utils/redis.js";

// Helper: build Distance Matrix request URL using URLSearchParams to handle encoding safely.
// Using explicit origins/destinations ensures we pass either "lat,lng" pairs or free-form addresses.
function buildUrl(origin, destination, key) {
  const base = "https://maps.googleapis.com/maps/api/distancematrix/json";
  const params = new URLSearchParams({
    origins: origin,
    destinations: destination,
    key
  });
  return `${base}?${params.toString()}`;
}

// Retrieve distance and ETA. Caches full API response (JSON) for a short TTL to avoid repeated calls.
// Throws if GOOGLE_MAPS_KEY is missing to surface misconfiguration quickly.
export async function getDistanceMatrix(origin, destination) {
  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_KEY not set");

  // Compose a deterministic cache key; include both endpoints to avoid collisions.
  const cacheKey = `dm:${origin}|${destination}`;

  // Try cache first. If Redis is not connected, get() will reject; swallow and proceed to fetch.
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // No-op: continue to API call when cache is unavailable.
  }

  // Execute the API request with axios (supports timeout/retry if configured).
  const url = buildUrl(origin, destination, key);
  const { data } = await axios.get(url);

  // Best-effort cache write; ignore failures to avoid impacting API flow.
  try {
    await redis.set(cacheKey, JSON.stringify(data), { EX: 300 }); // TTL: 5 minutes.
  } catch {
    // No-op: caching is optional.
  }

  return data;
}

// Build a Waze deep link for navigation apps. This is a pure function with no side-effects.
// Consumers can open the URL to launch Waze with the destination prefilled.
export function buildWazeLink(lat, lng) {
  return `https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`;
}
