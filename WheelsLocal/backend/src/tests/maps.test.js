// Test suite overview:
// This file validates core integrations and health for the Maps and Navigation layer:
// - Ensures parameter validation (/maps/distance → 400 without params).
// - Surfaces misconfiguration when GOOGLE_MAPS_KEY is missing (→ 500 with params).
// - Confirms basic liveness (/health).
// - Verifies Waze deep-link generation format.
// The suite uses ESM-friendly module mocking (jest.unstable_mockModule) to avoid
// real connections to Mongo and Redis, keeping tests fast and deterministic.

import request from "supertest";
// Imports Supertest to perform HTTP assertions against the Express app without starting a real network server.
// Supertest integrates with Jest to simplify request/response testing.

// Force a "test" environment to adjust behavior that depends on NODE_ENV (e.g., logging, connections).
process.env.NODE_ENV = "test";

// Create a lightweight mock for Mongoose to avoid real DB connections during test runs.
// We stub connect/set to resolved promises to satisfy app initialization code paths.
const mockedMongoose = { connect: jest.fn().mockResolvedValue(), set: jest.fn() };
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

// Import the Express app only after module mocks are in place so initialization uses the mocked modules.
// Top-level await ensures module loading order is preserved in ESM context.
const { default: app } = await import("../app.js");

describe("Maps distance", () => {
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

// Note:
// Keep tests isolated: modify environment variables within a test must be restored afterward.
// ESM mocking requires mocks to be applied before importing the module under test (top-level await ensures order).
