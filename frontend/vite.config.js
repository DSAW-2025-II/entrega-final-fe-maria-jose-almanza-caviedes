import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // bind to all interfaces (helps on Windows/WSL/containers)
    port: 5173,        // preferred port
    strictPort: true,  // fail if 5173 is in use instead of auto-incrementing
    open: true         // open browser automatically on start
  }
});
