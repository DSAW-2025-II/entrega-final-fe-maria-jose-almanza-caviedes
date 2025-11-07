// Maps integration endpoints (Distance Matrix) proxy to Google API via mapsService.
import { Router } from "express";
import { getDistanceMatrix } from "../services/mapsService.js";

const router = Router();

// GET /maps/distance?origin=...&destination=...
// Validates required query parameters and returns upstream JSON (distance, duration, etc.).
router.get("/distance", async (req, res) => {
  const { origin, destination } = req.query || {};
  if (!origin || !destination) return res.status(400).json({ error: "origin y destination requeridos" });
  try {
    const data = await getDistanceMatrix(origin, destination);
    res.json(data);
  } catch (e) {
    // Hide sensitive details (keys, URLs); provide a generic message and surface basic error info.
    res.status(500).json({ error: "Distance Matrix error", detail: e.message });
  }
});

export default router;
