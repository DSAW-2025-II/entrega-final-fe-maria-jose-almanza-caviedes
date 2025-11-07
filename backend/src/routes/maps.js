// Maps integration endpoints (Distance Matrix) proxy to Google API via mapsService.
import { Router } from "express";
import { calculateDistance, getDistanceMatrix, MapsServiceError } from "../services/mapsService.js";

const router = Router();

const ALLOWED_MODES = new Set(["driving", "walking", "bicycling", "transit"]);

function normalizePoint(value, label) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
    throw new Error(`${label} requerido`);
  }

  if (value && typeof value === "object") {
    const lat = Number(value.lat);
    const lng = Number(value.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error(`Coordenadas inválidas para ${label}`);
    }
    return `${lat},${lng}`;
  }

  throw new Error(`${label} requerido`);
}

function normalizeMode(mode) {
  if (!mode) return "driving";
  const normalized = String(mode).toLowerCase();
  if (ALLOWED_MODES.has(normalized)) return normalized;
  throw new Error("Modo de transporte inválido");
}

// GET /maps/distance?origin=...&destination=...
// Validates required query parameters and returns upstream JSON (distance, duration, etc.).
router.get("/distance", async (req, res) => {
  const { origin, destination } = req.query || {};
  if (!origin || !destination) return res.status(400).json({ error: "origin y destination requeridos" });
  try {
    const data = await getDistanceMatrix(origin, destination, { mode: normalizeMode(req.query.mode) });
    res.json(data);
  } catch (e) {
    const status = e instanceof MapsServiceError ? e.statusCode : 500;
    res.status(status).json({ error: "Distance Matrix error", detail: e.message, providerStatus: e.providerStatus });
  }
});

// POST /maps/calculate body: { origin, destination, mode? }
router.post("/calculate", async (req, res) => {
  const { origin, destination, mode } = req.body || {};

  let serializedOrigin;
  let serializedDestination;
  let finalMode;

  try {
    serializedOrigin = normalizePoint(origin, "origin");
    serializedDestination = normalizePoint(destination, "destination");
    finalMode = normalizeMode(mode);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const payload = await calculateDistance({ origin: serializedOrigin, destination: serializedDestination, mode: finalMode });
    res.json(payload);
  } catch (error) {
    if (error instanceof MapsServiceError) {
      return res.status(error.statusCode).json({
        error: error.message,
        providerStatus: error.providerStatus,
        cacheHit: error.cacheHit
      });
    }
    res.status(500).json({ error: "Distance Matrix error", detail: error.message });
  }
});

export default router;
