// Navigation utilities (Waze deep link) to open turn-by-turn navigation on client devices.
import { Router } from "express";
import { buildWazeLink } from "../services/mapsService.js";

const router = Router();

// GET /navigation/waze?lat=..&lng=..
// Returns a Waze URL that clients can open to start navigation to the specified coordinates.
router.get("/waze", (req, res) => {
  const { lat, lng } = req.query || {};
  if (!lat || !lng) return res.status(400).json({ error: "lat y lng requeridos" });
  const url = buildWazeLink(lat, lng);
  res.json({ url });
});

export default router;
