import request from "supertest";
import app from "../app.js";

describe("Auth routes", () => {
  it("should reject non-institutional email", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "user@example.com",
      name: "Test",
      password: "x"
    });
    expect(res.status).toBe(400);
  });
});
