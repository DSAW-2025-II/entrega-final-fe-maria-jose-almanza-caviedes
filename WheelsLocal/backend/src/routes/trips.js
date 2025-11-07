// Trip endpoints for creation, discovery, and seat booking with atomic updates.
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import Trip from "../models/Trip.js";

const router = Router();

// POST /trips: create a new trip authored by the authenticated driver.
router.post("/", requireAuth, async (req, res) => {
  const t = await Trip.create({ ...req.body, driver: req.user.sub });
  res.json(t);
});

// GET /trips: list all trips (public discovery). Apply filters/pagination in future iterations.
router.get("/", async (_req, res) => {
  const list = await Trip.find().lean();
  res.json(list);
});

// POST /trips/:id/book: atomically decrement seatsAvailable and add passenger.
// Uses $inc and $push in a single findOneAndUpdate with a predicate seatsAvailable > 0 to avoid race conditions.
router.post("/:id/book", requireAuth, async (req, res) => {
  const t = await Trip.findOneAndUpdate(
    { _id: req.params.id, seatsAvailable: { $gt: 0 } },
    { $inc: { seatsAvailable: -1 }, $push: { passengers: req.user.sub } },
    { new: true }
  );
  if (!t) return res.status(400).json({ error: "Sin cupos" });
  res.json(t);
});

export default router;
