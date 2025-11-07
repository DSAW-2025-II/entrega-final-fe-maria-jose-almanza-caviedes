// Ratings endpoints: create feedback and list ratings for a given user.
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import Rating from "../models/Rating.js";

const router = Router();

// POST /ratings: authenticated users can rate others (drivers/passengers).
router.post("/", requireAuth, async (req, res) => {
  const r = await Rating.create({ ...req.body, from: req.user.sub });
  res.json(r);
});

// GET /ratings/:userId: list ratings received by a specific user (public).
router.get("/:userId", async (req, res) => {
  const list = await Rating.find({ to: req.params.userId }).lean();
  res.json(list);
});

export default router;
