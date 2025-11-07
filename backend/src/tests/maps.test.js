// Test suite overview:
// This file validates core integrations and health for the Maps and Navigation layer:
// - Ensures parameter validation (/maps/distance → 400 without params).
// - Surfaces misconfiguration when GOOGLE_MAPS_KEY is missing (→ 500 with params).
// - Confirms new /maps/calculate happy-path, cache hit, and rate-limit handling.
// - Confirms basic liveness (/health) and Waze deep-link endpoint.
// The suite uses ESM-friendly module mocking (jest.unstable_mockModule) to avoid
// real connections to Mongo and Redis, keeping tests fast and deterministic.

import { jest } from "@jest/globals";
import request from "supertest";
// Imports Supertest to perform HTTP assertions against the Express app without starting a real network server.
// Supertest integrates with Jest to simplify request/response testing.

// Force a "test" environment to adjust behavior that depends on NODE_ENV (e.g., logging, connections).
process.env.NODE_ENV = "test";

// Create a lightweight mock for Mongoose to avoid real DB connections during test runs.
// We stub connect/set to resolved promises and expose minimal Schema/model helpers for app bootstrap.
class MockSchema {
  constructor(definition, options) {
    this.definition = definition;
    this.options = options;
    this.preHooks = new Map();
  }

  pre(event, handler) {
    this.preHooks.set(event, handler);
    return this;
  }
}
MockSchema.Types = { ObjectId: class MockObjectId {} };

const modelRegistry = new Map();

const mockedMongoose = {
  connect: jest.fn().mockResolvedValue(),
  set: jest.fn(),
  Schema: MockSchema,
  model: jest.fn((name, schema) => {
    if (schema) {
      const Model = function MockModel(doc = {}) {
        Object.assign(this, doc);
      };
      Model.find = jest.fn();
      Model.findOne = jest.fn();
      Model.findById = jest.fn();
      Model.findOneAndUpdate = jest.fn();
      Model.findOneAndDelete = jest.fn();
      Model.findByIdAndUpdate = jest.fn();
      Model.create = jest.fn();
      Model.deleteMany = jest.fn();
      Model.prototype.save = jest.fn();
      modelRegistry.set(name, Model);
      return Model;
    }
    return modelRegistry.get(name);
  }),
  models: {},
  connection: { readyState: 1 }
};
// Use Jest ESM mocking API to replace the "mongoose" module before importing the app.
// unstable_mockModule is required with ESM + top-level await so the module graph is intercepted in time.
await jest.unstable_mockModule("mongoose", () => ({ default: mockedMongoose }));

// Create a minimal Redis client mock to prevent network access and control cache behavior deterministically.
// - isOpen: simulates an already-connected client.
// - get/set/connect: stubbed to resolved promises for safe, predictable tests.
const mockedRedis = {
  isOpen: true,
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(),
  connect: jest.fn().mockResolvedValue()
};
// Replace the internal redis client module used by the app so services can run without a live Redis server.
await jest.unstable_mockModule("../utils/redis.js", () => ({ redis: mockedRedis }));

// Mock axios to avoid performing real HTTP requests to Google APIs.
const axiosGet = jest.fn();
await jest.unstable_mockModule("axios", () => ({ default: { get: axiosGet } }));

// Import the Express app only after module mocks are in place so initialization uses the mocked modules.
// Top-level await ensures module loading order is preserved in ESM context.
const { default: app } = await import("../app.js");

const SAMPLE_MATRIX_RESPONSE = {
  status: "OK",
  origin_addresses: ["Origen fake"],
  destination_addresses: ["Destino fake"],
  rows: [
    {
      elements: [
        {
          status: "OK",
          distance: { text: "12.5 km", value: 12500 },
          duration: { text: "25 mins", value: 1500 }
        }
      ]
    }
  ]
};

describe("Maps routes", () => {
  beforeEach(() => {
    axiosGet.mockReset();
    mockedRedis.get.mockReset().mockResolvedValue(null);
    mockedRedis.set.mockReset().mockResolvedValue();
    delete process.env.GOOGLE_MAPS_KEY;
  });

  // Verifies the endpoint validates required query params (origin/destination) and returns HTTP 400 when missing.
  it("should 400 without params", async () => {
    const res = await request(app).get("/maps/distance"); // No query params provided
    expect(res.status).toBe(400); // Expect bad request due to missing required params
  });

  // Ensures proper error handling when GOOGLE_MAPS_KEY is not set.
  // We temporarily remove the env var, call the endpoint with valid params, and assert a 500 error,
  // then restore the previous value to avoid side-effects on other tests.
  it("should 500 without GOOGLE_MAPS_KEY when params are present", async () => {
    const prev = process.env.GOOGLE_MAPS_KEY; // Backup current key (if any)
    delete process.env.GOOGLE_MAPS_KEY;       // Simulate missing configuration

    const res = await request(app)
      .get("/maps/distance")
      .query({ origin: "4.65,-74.05", destination: "4.86,-74.03" }); // Valid coordinates

    expect(res.status).toBe(500); // Service should fail fast without API key

    // Restore original env to keep test isolation and prevent unexpected failures in subsequent tests.
    if (prev) process.env.GOOGLE_MAPS_KEY = prev;
  });

  it("returns parsed payload in /maps/calculate", async () => {
    process.env.GOOGLE_MAPS_KEY = "test-key";
    axiosGet.mockResolvedValue({ data: SAMPLE_MATRIX_RESPONSE });

    const res = await request(app)
      .post("/maps/calculate")
      .send({ origin: { lat: 4.65, lng: -74.05 }, destination: { lat: 4.86, lng: -74.03 } });

    expect(res.status).toBe(200);
    expect(res.body.distanceKm).toBeCloseTo(12.5, 1);
    expect(res.body.durationMinutes).toBe(25);
    expect(res.body.providerMeta).toMatchObject({
      originAddress: "Origen fake",
      destinationAddress: "Destino fake",
      cacheHit: false,
      mode: "driving"
    });
    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  it("uses cache when available", async () => {
    process.env.GOOGLE_MAPS_KEY = "test-key";
    mockedRedis.get.mockResolvedValueOnce(JSON.stringify(SAMPLE_MATRIX_RESPONSE));

    const res = await request(app)
      .post("/maps/calculate")
      .send({ origin: "4.65,-74.05", destination: "4.86,-74.03" });

    expect(res.status).toBe(200);
    expect(res.body.providerMeta.cacheHit).toBe(true);
    expect(axiosGet).not.toHaveBeenCalled();
  });

  it("maps provider rate limit to 429", async () => {
    process.env.GOOGLE_MAPS_KEY = "test-key";
    axiosGet.mockResolvedValue({ data: { status: "OVER_QUERY_LIMIT" } });

    const res = await request(app)
      .post("/maps/calculate")
      .send({ origin: { lat: 1, lng: 1 }, destination: { lat: 2, lng: 2 } });

    expect(res.status).toBe(429);
    expect(res.body.providerStatus).toBe("OVER_QUERY_LIMIT");
  });

  // Basic liveness probe: ensures the app responds and the health route is wired correctly.
  it("health should be ok", async () => {
    const res = await request(app).get("/health"); // Health endpoint
    expect(res.status).toBe(200);                  // OK status
    expect(res.body).toEqual({ ok: true });        // Canonical health payload
  });

  // Validates the Waze deep-link generator endpoint returns a well-formed URL when given valid coordinates.
  // This test does not require external services and runs purely in-memory.
  it("waze deep link returns url", async () => {
    const res = await request(app)
      .get("/navigation/waze")
      .query({ lat: "4.65", lng: "-74.05" });         // Sample Bogotá-ish coordinates
    expect(res.status).toBe(200);                      // OK status
    expect(res.body.url).toMatch(/^https:\/\/waze\.com\/ul\?ll=/); // Basic format validation
  });
});

describe("Tariff suggestion", () => {
  it("rejects invalid payload", async () => {
    const res = await request(app)
      .post("/trips/tariff/suggest")
      .send({ distanceKm: -5, durationMinutes: 10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/distanceKm/);
  });

  it("returns suggested fare with range", async () => {
    const res = await request(app)
      .post("/trips/tariff/suggest")
      .send({ distanceKm: 12.5, durationMinutes: 25, demandFactor: 1.2 });

    expect(res.status).toBe(200);
    expect(res.body.suggestedTariff).toBeGreaterThan(0);
    expect(res.body.range.min).toBeLessThan(res.body.range.max);
    expect(res.body.breakdown).toMatchObject({
      demandFactor: expect.any(Number)
    });
  });
});

// Note:
// Keep tests isolated: modify environment variables within a test must be restored afterward.
// ESM mocking requires mocks to be applied before importing the module under test (top-level await ensures order).
