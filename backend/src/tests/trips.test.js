import request from "supertest";
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import Trip from "../models/Trip.js";

let app;
let mongoServer;

jest.setTimeout(30000);

function futureDate(hours = 6) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

async function registerAndLogin({ prefix = "user", asDriver = false } = {}) {
  const email = `${prefix}-${Date.now()}@unisabana.edu.co`;
  const password = "ClaveSegura123";
  const registerPayload = {
    email,
    password,
    firstName: prefix,
    lastName: "Tester",
    universityId: `A${Math.floor(Math.random() * 100000)}`,
    phone: "3000000000"
  };

  await request(app).post("/auth/register").send(registerPayload).expect(201);
  const userDoc = await User.findOne({ email }).lean();
  if (!userDoc) throw new Error("User not persisted");
  if (asDriver) {
    await User.updateOne({ _id: userDoc._id }, { $addToSet: { roles: "driver" } });
  }

  const loginRes = await request(app).post("/auth/login").send({ email, password }).expect(200);
  return { token: loginRes.body.token, userId: loginRes.body.user?.id, email };
}

async function createVehicle(ownerId, overrides = {}) {
  const payload = {
    owner: ownerId,
    plate: overrides.plate || `TST${Math.floor(Math.random() * 900 + 100)}`,
    brand: "Renault",
    model: "Logan",
    capacity: 4,
    soatExpiration: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120),
    licenseNumber: `LIC${Math.floor(Math.random() * 900 + 100)}`,
    licenseExpiration: new Date(Date.now() + 1000 * 60 * 60 * 24 * 150),
    status: "verified",
    ...overrides
  };
  return Vehicle.create(payload);
}

async function createTripForDriver({ driverToken, vehicleId, overrides = {} }) {
  const basePayload = {
    vehicleId,
    origin: "Campus Puente del Común",
    destination: "Chía",
    departureAt: futureDate(),
    seatsTotal: 3,
    pricePerSeat: 6000,
    pickupPoints: overrides.pickupPoints || []
  };

  const res = await request(app)
    .post("/trips")
    .set("Authorization", `Bearer ${driverToken}`)
    .send({ ...basePayload, ...overrides });

  expect(res.status).toBe(201);
  return res.body.trip;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();

  const appModule = await import("../app.js");
  app = appModule.default;
  await mongoose.connection.asPromise();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Vehicle.deleteMany({}), Trip.deleteMany({})]);
});

describe("Trip pickup suggestions", () => {
  it("allows passengers to create pickup suggestions that extend trip pickup points", async () => {
    const driver = await registerAndLogin({ prefix: "driver", asDriver: true });
    const vehicle = await createVehicle(driver.userId);
    const trip = await createTripForDriver({ driverToken: driver.token, vehicleId: vehicle._id.toString() });

    const passenger = await registerAndLogin({ prefix: "passenger" });

    const payload = {
      name: "Portal del Norte",
      description: "Entrada principal",
      lat: 4.7654,
      lng: -74.0321
    };

    const res = await request(app)
      .post(`/trips/${trip._id}/pickup-suggestions`)
      .set("Authorization", `Bearer ${passenger.token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body?.pickupPoint?.source).toBe("passenger");
    expect(res.body?.pickupPoint?.status).toBe("active");
    expect(String(res.body?.suggestion?.passenger)).toBe(passenger.userId);

    const storedTrip = await Trip.findById(trip._id).lean();
    expect(storedTrip.pickupPoints).toHaveLength(1);
    expect(storedTrip.pickupPoints[0].name).toBe(payload.name);
    expect(storedTrip.pickupSuggestions).toHaveLength(1);
  });

  it("limits each passenger to three pending pickup suggestions per trip", async () => {
    const driver = await registerAndLogin({ prefix: "driver-limit", asDriver: true });
    const vehicle = await createVehicle(driver.userId);
    const trip = await createTripForDriver({ driverToken: driver.token, vehicleId: vehicle._id.toString() });
    const passenger = await registerAndLogin({ prefix: "passenger-limit" });

    const makeRequest = (index) =>
      request(app)
        .post(`/trips/${trip._id}/pickup-suggestions`)
        .set("Authorization", `Bearer ${passenger.token}`)
        .send({
          name: `Punto ${index}`,
          lat: 4.7 + index * 0.001,
          lng: -74.05 - index * 0.001
        });

    await makeRequest(1).expect(201);
    await makeRequest(2).expect(201);
    await makeRequest(3).expect(201);

    const blocked = await makeRequest(4);
    expect(blocked.status).toBe(429);
    expect(blocked.body?.error).toMatch(/pendientes/i);
  });

  it("rejects pickup suggestion attempts from the trip owner", async () => {
    const driver = await registerAndLogin({ prefix: "driver-owner", asDriver: true });
    const vehicle = await createVehicle(driver.userId);
    const trip = await createTripForDriver({ driverToken: driver.token, vehicleId: vehicle._id.toString() });

    const res = await request(app)
      .post(`/trips/${trip._id}/pickup-suggestions`)
      .set("Authorization", `Bearer ${driver.token}`)
      .send({ name: "Portal Sur", lat: 4.562, lng: -74.097 });

    expect(res.status).toBe(400);
    expect(res.body?.error).toMatch(/conductores/i);
  });
});
