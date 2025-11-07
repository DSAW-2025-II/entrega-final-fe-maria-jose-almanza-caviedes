// Google Distance Matrix integration with optional Redis caching to reduce latency and quota usage.
import axios from "axios";
import { redis } from "../utils/redis.js";

// Custom error used to bubble provider-specific issues (rate limit, invalid params, etc.).
export class MapsServiceError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "MapsServiceError";
    this.statusCode = options.statusCode || 500;
    this.providerStatus = options.providerStatus;
    this.cacheHit = options.cacheHit || false;
  }
}

const RATE_LIMIT_STATUSES = new Set(["OVER_QUERY_LIMIT", "RESOURCE_EXHAUSTED"]);
const ZERO_RESULTS_STATUSES = new Set(["ZERO_RESULTS", "NOT_FOUND"]);

// Helper: build Distance Matrix request URL using URLSearchParams to handle encoding safely.
// Using explicit origins/destinations ensures we pass either "lat,lng" pairs or free-form addresses.
function buildUrl(origin, destination, key, mode) {
  const base = "https://maps.googleapis.com/maps/api/distancematrix/json";
  const params = new URLSearchParams({
    origins: origin,
    destinations: destination,
    key,
    mode
  });
  return `${base}?${params.toString()}`;
}

function buildCacheKey(origin, destination, mode) {
  return `dm:${mode}:${origin}|${destination}`;
}

async function fetchDistanceMatrix(origin, destination, { mode = "driving" } = {}) {
  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) throw new MapsServiceError("GOOGLE_MAPS_KEY not set", { statusCode: 500 });

  const cacheKey = buildCacheKey(origin, destination, mode);
  let cacheHit = false;
  let data;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      data = JSON.parse(cached);
      cacheHit = true;
    }
  } catch {
    // No-op: continue without cache if Redis is unavailable.
  }

  if (!data) {
    const url = buildUrl(origin, destination, key, mode);
    let response;
    try {
      response = await axios.get(url, { timeout: 10000 });
    } catch (error) {
      const statusCode = error?.response?.status;
      if (statusCode === 429) {
        throw new MapsServiceError("Rate limit exceeded", {
          statusCode: 429,
          providerStatus: "HTTP_429"
        });
      }
      throw new MapsServiceError("Distance Matrix request failed", {
        statusCode: 502,
        providerStatus: statusCode,
        cause: error
      });
    }
    data = response.data;
    try {
      await redis.set(cacheKey, JSON.stringify(data), { EX: 300 });
    } catch {
      // No-op: failure to cache should not break the flow.
    }
  }

  return { data, cacheHit };
}

// Retrieve distance and ETA. Legacy helper kept for backward compatibility.
export async function getDistanceMatrix(origin, destination, options = {}) {
  const { data } = await fetchDistanceMatrix(origin, destination, options);
  return data;
}

export async function calculateDistance({ origin, destination, mode = "driving" }) {
  const { data, cacheHit } = await fetchDistanceMatrix(origin, destination, { mode });

  const providerStatus = data?.status;
  if (!providerStatus) {
    throw new MapsServiceError("Respuesta inválida del proveedor", { statusCode: 502, cacheHit });
  }

  if (RATE_LIMIT_STATUSES.has(providerStatus)) {
    throw new MapsServiceError("Límite de consultas alcanzado", {
      statusCode: 429,
      providerStatus,
      cacheHit
    });
  }

  if (providerStatus !== "OK") {
    throw new MapsServiceError("Error en Distance Matrix", {
      statusCode: 502,
      providerStatus,
      cacheHit
    });
  }

  const element = data?.rows?.[0]?.elements?.[0];
  if (!element) {
    throw new MapsServiceError("Respuesta sin elementos", { statusCode: 502, cacheHit });
  }

  const elementStatus = element.status;
  if (RATE_LIMIT_STATUSES.has(elementStatus)) {
    throw new MapsServiceError("Límite de consultas alcanzado", {
      statusCode: 429,
      providerStatus: elementStatus,
      cacheHit
    });
  }

  if (ZERO_RESULTS_STATUSES.has(elementStatus)) {
    throw new MapsServiceError("No se encontraron rutas entre origen y destino", {
      statusCode: 404,
      providerStatus: elementStatus,
      cacheHit
    });
  }

  if (elementStatus !== "OK") {
    throw new MapsServiceError("Error en elemento de Distance Matrix", {
      statusCode: 502,
      providerStatus: elementStatus,
      cacheHit
    });
  }

  const distanceMeters = element?.distance?.value;
  const durationSeconds = element?.duration?.value;

  if (typeof distanceMeters !== "number" || typeof durationSeconds !== "number") {
    throw new MapsServiceError("Distancia o duración ausente", {
      statusCode: 502,
      providerStatus: elementStatus,
      cacheHit
    });
  }

  const distanceKm = Number((distanceMeters / 1000).toFixed(2));
  const durationMinutes = Math.round(durationSeconds / 60);

  const providerMeta = {
    originAddress: data?.origin_addresses?.[0] ?? null,
    destinationAddress: data?.destination_addresses?.[0] ?? null,
    distanceText: element?.distance?.text ?? null,
    durationText: element?.duration?.text ?? null,
    fare: element?.fare ?? null,
    status: elementStatus,
    cacheHit,
    mode
  };

  return {
    distanceKm,
    durationMinutes,
    providerMeta
  };
}

// Build a Waze deep link for navigation apps. This is a pure function with no side-effects.
// Consumers can open the URL to launch Waze with the destination prefilled.
export function buildWazeLink(lat, lng) {
  return `https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`;
}
