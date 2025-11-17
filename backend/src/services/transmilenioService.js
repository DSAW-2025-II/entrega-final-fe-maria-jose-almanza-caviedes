// ArcGIS integration to retrieve TransMilenio routes and stations with Redis-backed caching.
import axios from "axios";
import { redis } from "../utils/redis.js";

export class TransmilenioServiceError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "TransmilenioServiceError";
    this.statusCode = options.statusCode || 502;
    this.cause = options.cause;
    this.cacheHit = options.cacheHit || false;
  }
}

const DEFAULT_ROUTES_URL =
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_trazados_troncales/FeatureServer/0/query?where=1=1&outFields=*&f=geojson";
const DEFAULT_STATIONS_URL =
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_estaciones_troncales/FeatureServer/0/query?where=1=1&outFields=*&f=geojson";

const ROUTES_URL = process.env.TRANSMILENIO_ROUTES_URL || DEFAULT_ROUTES_URL;
const STATIONS_URL = process.env.TRANSMILENIO_STATIONS_URL || DEFAULT_STATIONS_URL;
const CACHE_TTL_SEC = Number(process.env.TRANSMILENIO_CACHE_TTL_SEC || 900);
const FETCH_TIMEOUT_MS = Number(process.env.TRANSMILENIO_TIMEOUT_MS || 15000);

function buildCacheKey(name) {
  return `transmilenio:${name}`;
}

async function readCache(cacheKey) {
  try {
    const raw = await redis.get(cacheKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeCache(cacheKey, value) {
  try {
    if (CACHE_TTL_SEC <= 0) return;
    await redis.set(cacheKey, JSON.stringify(value), { EX: CACHE_TTL_SEC });
  } catch {
    // Cache failures are non-blocking.
  }
}

function assertGeoJson(payload) {
  if (!payload || typeof payload !== "object" || payload.type !== "FeatureCollection") {
    throw new TransmilenioServiceError("Respuesta GeoJSON inválida", { statusCode: 502 });
  }
  if (!Array.isArray(payload.features)) {
    throw new TransmilenioServiceError("GeoJSON sin features", { statusCode: 502 });
  }
}

async function fetchLayer(name, url) {
  const cacheKey = buildCacheKey(name);
  const cached = await readCache(cacheKey);
  if (cached?.data) {
    return { ...cached, cacheHit: true };
  }

  let response;
  try {
    response = await axios.get(url, { timeout: FETCH_TIMEOUT_MS });
  } catch (error) {
    const statusCode = error?.response?.status || 502;
    throw new TransmilenioServiceError("TransMilenio no disponible", {
      statusCode,
      cause: error
    });
  }

  const payload = response.data;
  assertGeoJson(payload);

  const record = {
    data: payload,
    fetchedAt: new Date().toISOString()
  };

  await writeCache(cacheKey, record);
  return { ...record, cacheHit: false };
}

export async function getTransmilenioRoutes() {
  return fetchLayer("routes", ROUTES_URL);
}

export async function getTransmilenioStations() {
  return fetchLayer("stations", STATIONS_URL);
}
