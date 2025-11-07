// Minimal OpenAPI 3 spec powering Swagger UI. Extend as endpoints evolve (schemas, params, auth).
const swaggerSpec = {
  openapi: "3.0.0", // OpenAPI version used.
  info: {
    title: "Wheels Sabana API", // Human-friendly API title shown in docs.
    version: "1.0.0"            // API version for consumers and QA.
  },
  servers: [{ url: "http://localhost:4000" }], // Base server for local development.
  // Path stubs to surface main endpoints in the UI. Replace with full schema details as needed.
  paths: {
    "/auth/register": { post: { summary: "Registro", responses: { "200": { description: "OK" } } } },
    "/auth/login": { post: { summary: "Login", responses: { "200": { description: "OK" } } } },
    "/auth/me": { get: { summary: "Perfil", responses: { "200": { description: "OK" } } } },
    "/maps/distance": {
      get: {
        summary: "Distance Matrix (legacy)",
        responses: { "200": { description: "OK" } }
      }
    },
    "/maps/calculate": {
      post: {
        summary: "Calcular distancia y duración",
        responses: { "200": { description: "OK" }, "429": { description: "Rate limit" } }
      }
    },
    "/trips/tariff/suggest": {
      post: {
        summary: "Tarifa sugerida",
        responses: {
          "200": { description: "OK" },
          "400": { description: "Solicitud inválida" }
        }
      }
    },
    "/navigation/waze": { get: { summary: "Deep link Waze", responses: { "200": { description: "OK" } } } }
  }
};

export default swaggerSpec;
