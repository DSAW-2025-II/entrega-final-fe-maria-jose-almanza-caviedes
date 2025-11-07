// Vehicle management endpoints (CRUD + pickup points) scoped to the authenticated owner.
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import Vehicle from "../models/Vehicle.js";

const router = Router();

// POST /vehicles: create a vehicle under the authenticated user.
// Ownership is enforced by setting owner from the JWT subject.
router.post("/", requireAuth, async (req, res) => {
  const v = await Vehicle.create({ ...req.body, owner: req.user.sub });
  res.json(v);
});

// GET /vehicles: list vehicles belonging to the authenticated user.
// Uses lean() for performance (returns plain JS objects, not Mongoose documents).
router.get("/", requireAuth, async (req, res) => {
  const list = await Vehicle.find({ owner: req.user.sub }).lean();
  res.json(list);
});

// PUT /vehicles/:id: update a vehicle if it belongs to the user.
// findOneAndUpdate with filter {owner} prevents unauthorized edits.
router.put("/:id", requireAuth, async (req, res) => {
  const v = await Vehicle.findOneAndUpdate({ _id: req.params.id, owner: req.user.sub }, req.body, { new: true });
  res.json(v);
});

// DELETE /vehicles/:id: remove the vehicle if owned by the user.
router.delete("/:id", requireAuth, async (req, res) => {
  await Vehicle.deleteOne({ _id: req.params.id, owner: req.user.sub });
  res.json({ ok: true });
});

// POST /vehicles/pickup-points: append a pickup point to a specific vehicle owned by the user.
// Validates ownership by querying with owner constraint.
router.post("/pickup-points", requireAuth, async (req, res) => {
  const { vehicleId, name, lat, lng } = req.body || {};
  const v = await Vehicle.findOne({ _id: vehicleId, owner: req.user.sub });
  if (!v) return res.status(404).json({ error: "Vehículo no encontrado" });
  v.pickupPoints.push({ name, lat, lng });
  await v.save();
  res.json(v);
});

export default router;
