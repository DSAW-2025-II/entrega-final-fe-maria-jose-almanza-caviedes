// Vehicle management endpoints (CRUD + pickup points) scoped to the authenticated owner.
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";

const router = Router();

function normalizePickupPoint(input) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const rawDescription = typeof input?.description === "string" ? input.description.trim() : "";
  const description = rawDescription ? rawDescription : undefined;
  const latNumber = Number(input?.lat);
  const lngNumber = Number(input?.lng);

  if (!name) {
    return { error: "Nombre de punto requerido" };
  }
  if (Number.isNaN(latNumber) || Number.isNaN(lngNumber)) {
    return { error: "Coordenadas inválidas" };
  }
  if (latNumber < -90 || latNumber > 90 || lngNumber < -180 || lngNumber > 180) {
    return { error: "Coordenadas fuera de rango" };
  }

  return {
    name,
    description,
    lat: latNumber,
    lng: lngNumber
  };
}

// POST /vehicles: create a vehicle under the authenticated user.
// Ownership is enforced by setting owner from the JWT subject.
router.post("/", requireAuth, async (req, res) => {
  const {
    plate,
    brand,
    model,
    capacity,
    vehiclePhotoUrl,
    soatPhotoUrl,
    soatExpiration,
    licenseNumber,
    licenseExpiration
  } = req.body || {};
  const numericCapacity = Number(capacity);
  if (!plate || !brand || !model || !capacity || !soatExpiration || !licenseNumber || !licenseExpiration) {
    return res.status(400).json({ error: "Datos de vehículo incompletos" });
  }
  if (!Number.isInteger(numericCapacity) || numericCapacity < 1 || numericCapacity > 8) {
    return res.status(400).json({ error: "Capacidad de vehículo inválida" });
  }

  const soatDate = new Date(soatExpiration);
  const licenseExpDate = new Date(licenseExpiration);
  if (Number.isNaN(soatDate.getTime()) || Number.isNaN(licenseExpDate.getTime())) {
    return res.status(400).json({ error: "Fechas de documentos inválidas" });
  }
  if (soatDate < new Date()) {
    return res.status(400).json({ error: "SOAT vencido" });
  }
  if (licenseExpDate < new Date()) {
    return res.status(400).json({ error: "Licencia vencida" });
  }

  try {
    const normalizedPlate = String(plate).trim().toUpperCase();
    const v = await Vehicle.create({
      owner: req.user.sub,
      plate: normalizedPlate,
      brand,
      model,
      capacity: numericCapacity,
      vehiclePhotoUrl,
      soatPhotoUrl,
      soatExpiration: soatDate,
      licenseNumber,
      licenseExpiration: licenseExpDate
    });

    const user = await User.findById(req.user.sub);
    if (user && !user.roles.includes("driver")) {
      user.roles.push("driver");
    }
    if (user && !user.activeVehicle) {
      user.activeVehicle = v._id;
    }
    if (user) await user.save();

    res.status(201).json(v);
  } catch (err) {
    if (err?.code === 11000) {
      if (err.keyValue?.plate) return res.status(409).json({ error: "Placa ya registrada" });
    }
    console.error("vehicle create", err);
    res.status(500).json({ error: "No se pudo registrar el vehículo" });
  }
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
  const {
    plate,
    brand,
    model,
    capacity,
    vehiclePhotoUrl,
    soatPhotoUrl,
  pickupPoints,
    soatExpiration,
    licenseNumber,
    licenseExpiration
  } = req.body || {};
  const updates = { plate, brand, model, vehiclePhotoUrl, soatPhotoUrl };
  if (plate !== undefined) {
    updates.plate = String(plate).trim().toUpperCase();
  }
  if (capacity !== undefined) {
    const numericCapacity = Number(capacity);
    if (!Number.isInteger(numericCapacity) || numericCapacity < 1 || numericCapacity > 8) {
      return res.status(400).json({ error: "Capacidad de vehículo inválida" });
    }
    updates.capacity = numericCapacity;
  }
  if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber;
  if (soatExpiration !== undefined) {
    const soatDate = new Date(soatExpiration);
    if (Number.isNaN(soatDate.getTime())) {
      return res.status(400).json({ error: "Fecha de SOAT inválida" });
    }
    if (soatDate < new Date()) {
      return res.status(400).json({ error: "SOAT vencido" });
    }
    updates.soatExpiration = soatDate;
  }
  if (licenseExpiration !== undefined) {
    const licenseDate = new Date(licenseExpiration);
    if (Number.isNaN(licenseDate.getTime())) {
      return res.status(400).json({ error: "Fecha de licencia inválida" });
    }
    if (licenseDate < new Date()) {
      return res.status(400).json({ error: "Licencia vencida" });
    }
    updates.licenseExpiration = licenseDate;
  }
  if (pickupPoints !== undefined) {
    if (!Array.isArray(pickupPoints)) {
      return res.status(400).json({ error: "pickupPoints debe ser una lista" });
    }
    const sanitized = [];
    for (const point of pickupPoints) {
      const normalized = normalizePickupPoint(point);
      if (normalized.error) {
        return res.status(400).json({ error: normalized.error });
      }
      sanitized.push({ ...normalized, _id: point?._id });
    }
    updates.pickupPoints = sanitized;
  }
  Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);
  try {
    const v = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.sub },
      updates,
      { new: true, runValidators: true }
    );
    if (!v) return res.status(404).json({ error: "Vehículo no encontrado" });
    res.json(v);
  } catch (err) {
    if (err?.code === 11000 && err.keyValue?.plate) {
      return res.status(409).json({ error: "Placa ya registrada" });
    }
    console.error("vehicle update", err);
    res.status(500).json({ error: "No se pudo actualizar el vehículo" });
  }
});

// DELETE /vehicles/:id: remove the vehicle if owned by the user.
router.delete("/:id", requireAuth, async (req, res) => {
  const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, owner: req.user.sub });
  if (!vehicle) return res.status(404).json({ error: "Vehículo no encontrado" });

  const user = await User.findById(req.user.sub);
  if (user) {
    const remainingVehicles = await Vehicle.find({ owner: req.user.sub }).sort({ createdAt: 1 });
    if (!remainingVehicles.length) {
      user.roles = user.roles.filter((role) => role !== "driver");
      if (user.activeRole === "driver") {
        user.activeRole = "passenger";
      }
      user.activeVehicle = null;
    } else {
      const now = new Date();
      const nextActive =
        remainingVehicles.find(
          (v) => v.soatExpiration >= now && v.licenseExpiration >= now
        ) || remainingVehicles[0];

      if (!user.activeVehicle || user.activeVehicle.toString() === vehicle._id.toString()) {
        user.activeVehicle = nextActive?._id || null;
      }
      if (!user.roles.includes("driver")) {
        user.roles.push("driver");
      }
    }
    await user.save();
  }

  res.json({ ok: true });
});

// PUT /vehicles/:id/activate: mark selected vehicle as the driver's active vehicle for future trips.
router.put("/:id/activate", requireAuth, async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user.sub });
  if (!vehicle) return res.status(404).json({ error: "Vehículo no encontrado" });

  const now = new Date();
  if (vehicle.soatExpiration < now || vehicle.licenseExpiration < now) {
    return res.status(400).json({ error: "Actualiza los documentos antes de activar este vehículo" });
  }

  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  user.activeVehicle = vehicle._id;
  if (!user.roles.includes("driver")) {
    user.roles.push("driver");
  }
  await user.save();

  return res.json({ user: { id: user._id, activeVehicle: user.activeVehicle }, vehicle });
});

router.get("/:id/pickup-points", requireAuth, async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user.sub }).lean();
  if (!vehicle) return res.status(404).json({ error: "Vehículo no encontrado" });
  return res.json({ pickupPoints: vehicle.pickupPoints || [] });
});

router.post("/:id/pickup-points", requireAuth, async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user.sub });
  if (!vehicle) return res.status(404).json({ error: "Vehículo no encontrado" });

  const normalized = normalizePickupPoint(req.body || {});
  if (normalized.error) {
    return res.status(400).json({ error: normalized.error });
  }

  vehicle.pickupPoints.push(normalized);
  await vehicle.save();

  const created = vehicle.pickupPoints[vehicle.pickupPoints.length - 1];
  return res.status(201).json({ pickupPoint: created });
});

router.put("/:id/pickup-points/:pointId", requireAuth, async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user.sub });
  if (!vehicle) return res.status(404).json({ error: "Vehículo no encontrado" });

  const point = vehicle.pickupPoints.id(req.params.pointId);
  if (!point) {
    return res.status(404).json({ error: "Punto no encontrado" });
  }

  const normalized = normalizePickupPoint(req.body || {});
  if (normalized.error) {
    return res.status(400).json({ error: normalized.error });
  }

  point.name = normalized.name;
  point.description = normalized.description;
  point.lat = normalized.lat;
  point.lng = normalized.lng;

  await vehicle.save();
  return res.json({ pickupPoint: point });
});

router.delete("/:id/pickup-points/:pointId", requireAuth, async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user.sub });
  if (!vehicle) return res.status(404).json({ error: "Vehículo no encontrado" });

  const point = vehicle.pickupPoints.id(req.params.pointId);
  if (!point) {
    return res.status(404).json({ error: "Punto no encontrado" });
  }

  point.deleteOne();
  await vehicle.save();

  return res.json({ ok: true });
});

export default router;
