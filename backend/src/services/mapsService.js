// OpenRouteService directions integration with optional Redis caching to reduce latency and quota usage.
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
    this.providerMessage = options.providerMessage;
  }
}

const MODE_PROFILE_MAP = {
  driving: "driving-car",
  walking: "foot-walking",
  bicycling: "cycling-regular"
};

function buildCacheKey(origin, destination, profile) {
  return `ors:${profile}:${origin}|${destination}`;
}

function parsePoint(point, label) {
  if (typeof point === "string") {
    const trimmed = point.trim();
    if (!trimmed) {
      throw new MapsServiceError(`${label} requerido`, { statusCode: 400 });
    }
    const parts = trimmed.split(",");
    if (parts.length !== 2) {
      throw new MapsServiceError(`Formato inválido para ${label}. Usa lat,lng`, { statusCode: 400 });
    }
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new MapsServiceError(`Coordenadas inválidas para ${label}`, { statusCode: 400 });
    }
    return { lat, lng };
  }

  if (point && typeof point === "object") {
    const lat = Number(point.lat);
    const lng = Number(point.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new MapsServiceError(`Coordenadas inválidas para ${label}`, { statusCode: 400 });
    }
    return { lat, lng };
  }

  throw new MapsServiceError(`${label} requerido`, { statusCode: 400 });
}

function toLonLat({ lat, lng }) {
  return `${lng},${lat}`;
}

function buildUrl(originLonLat, destinationLonLat, key, profile) {
  const base = `https://api.openrouteservice.org/v2/directions/${profile}`;
  const params = new URLSearchParams({
    api_key: key,
    start: originLonLat,
    end: destinationLonLat
  });
  return `${base}?${params.toString()}`;
}

async function fetchDirections(origin, destination, { mode = "driving" } = {}) {
  const key = process.env.OPENROUTESERVICE_KEY;
  if (!key) throw new MapsServiceError("OPENROUTESERVICE_KEY not set", { statusCode: 500 });

  const profile = MODE_PROFILE_MAP[mode];
  if (!profile) {
    throw new MapsServiceError("Modo de transporte no soportado", { statusCode: 400 });
  }

  const originPoint = parsePoint(origin, "origin");
  const destinationPoint = parsePoint(destination, "destination");
  const originLonLat = toLonLat(originPoint);
  const destinationLonLat = toLonLat(destinationPoint);

  const cacheKey = buildCacheKey(originLonLat, destinationLonLat, profile);
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
    const url = buildUrl(originLonLat, destinationLonLat, key, profile);
    let response;
    try {
      response = await axios.get(url, { timeout: 10000 });
    } catch (error) {
      const statusCode = error?.response?.status;
      const providerMessage = error?.response?.data?.error?.message || error?.message;
      if (statusCode === 429) {
        throw new MapsServiceError("Límite de consultas alcanzado", {
          statusCode: 429,
          providerStatus: "HTTP_429",
          cause: error
        });
      }
      throw new MapsServiceError("Solicitud a OpenRouteService falló", {
        statusCode: statusCode || 502,
        providerStatus: statusCode,
        cacheHit,
        cause: error,
        providerMessage
      });
    }
    data = response.data;
    try {
      await redis.set(cacheKey, JSON.stringify(data), { EX: 300 });
    } catch {
      // No-op: failure to cache should not break the flow.
    }
  }

  return { data, cacheHit, profile, originPoint, destinationPoint };
}

// Retrieve distance and ETA. Legacy helper kept for backward compatibility.
export async function getDistanceMatrix(origin, destination, options = {}) {
  const { data } = await fetchDirections(origin, destination, options);
  return data;
}

export async function calculateDistance({ origin, destination, mode = "driving" }) {
  const { data, cacheHit, profile, originPoint, destinationPoint } = await fetchDirections(origin, destination, {
    mode
  });

  const feature = data?.features?.[0];
  const summary = feature?.properties?.summary;
  const segment = feature?.properties?.segments?.[0];

  const distanceMeters = summary?.distance ?? segment?.distance;
  const durationSeconds = summary?.duration ?? segment?.duration;

  if (typeof distanceMeters !== "number" || typeof durationSeconds !== "number") {
    throw new MapsServiceError("Distancia o duración ausente", {
      statusCode: 502,
      providerStatus: "NO_SUMMARY",
      cacheHit
    });
  }

  const distanceKm = Number((distanceMeters / 1000).toFixed(2));
  const durationMinutes = Math.round(durationSeconds / 60);

  const providerMeta = {
    provider: "openrouteservice",
    profile,
    cacheHit,
    status: "OK",
    origin: originPoint,
    destination: destinationPoint
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
