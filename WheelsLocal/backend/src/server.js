// Loads the Express app instance (configured in app.js) and environment variables.
import app from "./app.js";
import dotenv from "dotenv";

// Load environment variables from .env into process.env early in the lifecycle,
// ensuring configuration (PORT, HOST, DB URIs) is available for server setup.
dotenv.config();

// Read the port/host from the environment with safe defaults.
// Using 0.0.0.0 allows binding on all interfaces (required inside Docker).
const port = process.env.PORT || 4000;
const host = process.env.HOST || "0.0.0.0";

// Start the HTTP server and log helpful URLs. Wrapping app.listen in a variable
// lets us attach error handlers (EADDRINUSE, EACCES) for clearer diagnostics.
const server = app.listen(port, host, () => {
  // If host is 0.0.0.0 (Docker-friendly), suggest localhost for local testing.
  console.log(`API Wheels Sabana en http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
  console.log(`Health: http://localhost:${port}/health  |  Swagger: http://localhost:${port}/api-docs`);
});

// Centralized server error handling to provide actionable messages instead of silent failures.
// This is important in dev/containers where ports may be occupied or permissions limited.
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Puerto ${port} en uso. Cierra el proceso que lo ocupa y reintenta.`);
  } else if (err.code === "EACCES") {
    console.error(`Permisos insuficientes para usar el puerto ${port}.`);
  } else {
    console.error("Error del servidor:", err);
  }
});

// Capturar errores no manejados y rechazos para debug
process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at Promise:", p, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
  // No se fuerza exit aquí para facilitar debugging; reinicia manualmente si procede.
});
