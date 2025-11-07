// Trip endpoints for creation, discovery, and seat booking with atomic updates.
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import { suggestTariff, validateTariffInputs } from "../services/tariffService.js";

const router = Router();

function sanitizeTrip(trip) {
  if (!trip) return null;
  const obj = trip.toObject ? trip.toObject({ versionKey: false }) : trip;
  return obj;
}

// POST /trips: create a new trip authored by the authenticated driver.
router.post("/", requireAuth, async (req, res) => {
  const {
    vehicleId,
    origin,
    destination,
    routeDescription,
    departureAt,
    seatsTotal,
    pricePerSeat,
    pickupPoints,
    distanceKm,
    durationMinutes
  } = req.body || {};

  if (!origin || !destination || !departureAt || !seatsTotal || pricePerSeat == null) {
    return res.status(400).json({ error: "Datos incompletos para crear viaje" });
  }

  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  if (!user.roles?.includes("driver")) {
    return res.status(403).json({ error: "Activa el modo conductor para publicar viajes" });
  }

  const finalVehicleId = vehicleId || user.activeVehicle;
  if (!finalVehicleId) {
    return res.status(400).json({ error: "Selecciona un vehículo con documentos vigentes" });
  }

  const vehicle = await Vehicle.findOne({ _id: finalVehicleId, owner: req.user.sub });
  if (!vehicle) {
    return res.status(404).json({ error: "Vehículo no encontrado" });
  }

  const now = new Date();
  if (vehicle.soatExpiration < now || vehicle.licenseExpiration < now) {
    return res.status(400).json({ error: "Actualiza los documentos del vehículo antes de crear viajes" });
  }

  const departureDate = new Date(departureAt);
  if (Number.isNaN(departureDate.getTime())) {
    return res.status(400).json({ error: "Fecha de salida inválida" });
  }
  if (departureDate < now) {
    return res.status(400).json({ error: "La fecha de salida debe ser futura" });
  }

  const seatsNumber = Number(seatsTotal);
  if (!Number.isInteger(seatsNumber) || seatsNumber < 1) {
    return res.status(400).json({ error: "Cantidad de puestos inválida" });
  }
  if (seatsNumber > vehicle.capacity) {
    return res.status(400).json({ error: "Los puestos superan la capacidad del vehículo" });
  }

  const priceNumber = Number(pricePerSeat);
  if (Number.isNaN(priceNumber) || priceNumber < 0) {
    return res.status(400).json({ error: "Precio por puesto inválido" });
  }

  if (pickupPoints && !Array.isArray(pickupPoints)) {
    return res.status(400).json({ error: "pickupPoints debe ser una lista" });
  }

  if (pickupPoints) {
    const invalidPoint = pickupPoints.find(
      (p) => !p?.name || Number.isNaN(Number(p.lat)) || Number.isNaN(Number(p.lng))
    );
    if (invalidPoint) {
      return res.status(400).json({ error: "Cada punto de recogida requiere nombre y coordenadas" });
    }
  }

  const tripPayload = {
    driver: req.user.sub,
    vehicle: vehicle._id,
    origin,
    destination,
    routeDescription,
    departureAt: departureDate,
    seatsTotal: seatsNumber,
    seatsAvailable: seatsNumber,
    pricePerSeat: priceNumber,
    pickupPoints: pickupPoints?.map((p) => ({
      name: p.name,
      description: p.description,
      lat: Number(p.lat),
      lng: Number(p.lng)
    })),
    distanceKm: distanceKm != null ? Number(distanceKm) : undefined,
    durationMinutes: durationMinutes != null ? Number(durationMinutes) : undefined
  };

  if (tripPayload.distanceKm != null && (Number.isNaN(tripPayload.distanceKm) || tripPayload.distanceKm < 0)) {
    return res.status(400).json({ error: "Distancia inválida" });
  }
  if (tripPayload.durationMinutes != null && (Number.isNaN(tripPayload.durationMinutes) || tripPayload.durationMinutes < 0)) {
    return res.status(400).json({ error: "Duración inválida" });
  }

  Object.keys(tripPayload).forEach((key) => tripPayload[key] === undefined && delete tripPayload[key]);

  const trip = await Trip.create(tripPayload);

  res.status(201).json({ trip: sanitizeTrip(trip) });
});

// GET /trips: list all trips with optional filters for passengers.
router.get("/", async (req, res) => {
  const { departure_point, min_seats, max_price } = req.query || {};
  const criteria = { status: { $in: ["scheduled", "full"] } };

  if (departure_point) {
    criteria.origin = { $regex: departure_point, $options: "i" };
  }
  if (min_seats) {
    const seats = Number(min_seats);
    if (!Number.isNaN(seats)) criteria.seatsAvailable = { $gte: seats };
  }
  if (max_price) {
    const price = Number(max_price);
    if (!Number.isNaN(price)) criteria.pricePerSeat = { $lte: price };
  }

  const list = await Trip.find(criteria).sort({ departureAt: 1 }).lean();
  res.json({ trips: list });
});

router.post("/tariff/suggest", (req, res) => {
  const validationError = validateTariffInputs(req.body || {});
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const suggestion = suggestTariff(req.body || {});
  res.json(suggestion);
});

// POST /trips/:id/reservations: passenger books one or more seats selecting pickup points.
router.post("/:id/reservations", requireAuth, async (req, res) => {
  const { seats, pickupPoints, paymentMethod } = req.body || {};
  const seatsRequested = Number(seats);
  if (!Number.isInteger(seatsRequested) || seatsRequested < 1) {
    return res.status(400).json({ error: "Cantidad de puestos inválida" });
  }
  if (!Array.isArray(pickupPoints) || pickupPoints.length !== seatsRequested) {
    return res.status(400).json({ error: "Debes indicar un punto de recogida por puesto" });
  }

  if (paymentMethod && !["cash", "nequi"].includes(paymentMethod)) {
    return res.status(400).json({ error: "Método de pago inválido" });
  }
  const reservationDoc = {
    passenger: req.user.sub,
    seats: seatsRequested,
    pickupPoints: pickupPoints.map((p) => ({
      name: p.name,
      description: p.description,
      lat: Number(p.lat),
      lng: Number(p.lng)
    })),
    paymentMethod: paymentMethod || "cash",
    status: "pending"
  };

  const trip = await Trip.findOneAndUpdate(
    {
      _id: req.params.id,
      seatsAvailable: { $gte: seatsRequested },
      status: { $in: ["scheduled", "full"] },
      driver: { $ne: req.user.sub },
      reservations: {
        $not: {
          $elemMatch: { passenger: req.user.sub, status: { $in: ["pending", "confirmed"] } }
        }
      }
    },
    {
      $inc: { seatsAvailable: -seatsRequested },
      $push: { reservations: reservationDoc }
    },
    { new: true }
  );

  if (!trip) {
    const existingTrip = await Trip.findById(req.params.id);
    if (!existingTrip) return res.status(404).json({ error: "Viaje no encontrado" });
    if (existingTrip.driver.toString() === req.user.sub) {
      return res.status(400).json({ error: "No puedes reservar tu propio viaje" });
    }
    if (existingTrip.status === "cancelled" || existingTrip.status === "completed") {
      return res.status(400).json({ error: "El viaje no está disponible" });
    }
    if (existingTrip.seatsAvailable < seatsRequested) {
      return res.status(400).json({ error: "Sin cupos suficientes" });
    }
    const hasReservation = existingTrip.reservations?.some(
      (r) => r.passenger.toString() === req.user.sub && r.status === "confirmed"
    );
    if (hasReservation) {
      return res.status(400).json({ error: "Ya tienes una reserva activa en este viaje" });
    }
    return res.status(400).json({ error: "No se pudo crear la reserva" });
  }

  if (trip.seatsAvailable === 0 && trip.status !== "full") {
    trip.status = "full";
    await trip.save();
  }

  res.status(201).json({ trip: sanitizeTrip(trip) });
});

function adjustTripCapacity(trip) {
  if (trip.seatsAvailable === 0 && trip.status === "scheduled") {
    trip.status = "full";
  }
  if (trip.seatsAvailable > 0 && trip.status === "full") {
    trip.status = "scheduled";
  }
}

router.put("/:tripId/reservations/:reservationId/confirm", requireAuth, async (req, res) => {
  const { tripId, reservationId } = req.params;
  const trip = await Trip.findOne({ _id: tripId, driver: req.user.sub });
  if (!trip) return res.status(404).json({ error: "Viaje no encontrado" });

  const reservation = trip.reservations.id(reservationId);
  if (!reservation) return res.status(404).json({ error: "Reserva no encontrada" });
  if (reservation.status === "rejected" || reservation.status === "cancelled") {
    return res.status(400).json({ error: "La reserva ya fue cancelada" });
  }
  if (reservation.status === "confirmed") {
    return res.json({ trip: sanitizeTrip(trip) });
  }
  if (reservation.status !== "pending") {
    return res.status(400).json({ error: "Reserva en estado inválido" });
  }

  reservation.status = "confirmed";
  reservation.decisionAt = new Date();

  adjustTripCapacity(trip);
  await trip.save();
  return res.json({ trip: sanitizeTrip(trip) });
});

router.put("/:tripId/reservations/:reservationId/reject", requireAuth, async (req, res) => {
  const { tripId, reservationId } = req.params;
  const trip = await Trip.findOne({ _id: tripId, driver: req.user.sub });
  if (!trip) return res.status(404).json({ error: "Viaje no encontrado" });

  const reservation = trip.reservations.id(reservationId);
  if (!reservation) return res.status(404).json({ error: "Reserva no encontrada" });
  if (reservation.status === "rejected" || reservation.status === "cancelled") {
    return res.json({ trip: sanitizeTrip(trip) });
  }
  if (reservation.status !== "pending") {
    return res.status(400).json({ error: "Solo reservas pendientes pueden rechazarse" });
  }

  reservation.status = "rejected";
  reservation.decisionAt = new Date();
  trip.seatsAvailable = Math.min(trip.seatsAvailable + reservation.seats, trip.seatsTotal);
  adjustTripCapacity(trip);
  await trip.save();
  return res.json({ trip: sanitizeTrip(trip) });
});

router.put("/:tripId/reservations/:reservationId/cancel", requireAuth, async (req, res) => {
  const { tripId, reservationId } = req.params;
  const trip = await Trip.findOne({ _id: tripId, "reservations._id": reservationId });
  if (!trip) return res.status(404).json({ error: "Reserva no encontrada" });

  const reservation = trip.reservations.id(reservationId);
  const isDriver = trip.driver.toString() === req.user.sub;
  const isPassenger = reservation.passenger?.toString() === req.user.sub;
  if (!isDriver && !isPassenger) {
    return res.status(403).json({ error: "No autorizado" });
  }
  if (reservation.status === "cancelled" || reservation.status === "rejected") {
    return res.json({ trip: sanitizeTrip(trip) });
  }

  reservation.status = "cancelled";
  reservation.decisionAt = new Date();
  trip.seatsAvailable = Math.min(trip.seatsAvailable + reservation.seats, trip.seatsTotal);
  adjustTripCapacity(trip);
  await trip.save();
  return res.json({ trip: sanitizeTrip(trip) });
});

// PUT /trips/:id/cancel: driver cancels trip and frees seats.
router.put("/:id/cancel", requireAuth, async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, driver: req.user.sub });
  if (!trip) return res.status(404).json({ error: "Viaje no encontrado" });

  trip.status = "cancelled";
  trip.seatsAvailable = 0;
  trip.reservations = trip.reservations.map((reservation) => ({
    ...(reservation?.toObject ? reservation.toObject() : reservation),
    status: "cancelled"
  }));

  await trip.save();

  res.json({ trip: sanitizeTrip(trip) });
});

// GET /trips/:id/passengers: driver views confirmed passengers and pickup points.
router.get("/:id/passengers", requireAuth, async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, driver: req.user.sub })
    .populate("reservations.passenger", "firstName lastName phone email")
    .lean();
  if (!trip) return res.status(404).json({ error: "Viaje no encontrado" });

  const passengers = (trip.reservations || []).map((r) => ({
    id: r._id,
    passenger: r.passenger,
    seats: r.seats,
    pickupPoints: r.pickupPoints,
    paymentMethod: r.paymentMethod,
    status: r.status,
    decisionAt: r.decisionAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  }));

  res.json({ passengers });
});

export default router;
