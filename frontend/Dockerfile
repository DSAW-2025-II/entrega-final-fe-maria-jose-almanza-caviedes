# Dockerfile (frontend) — Development oriented:
# - Runs CRA/react-scripts dev server with HMR inside a container.
# - Optimized build layering: copy manifests → install deps → copy source.
# - For production, prefer building static assets and serving via Nginx/CDN.

FROM node:18
# Base image: Node 18 LTS ensures compatibility with modern React tooling and receives security updates.
# Pinning a major version avoids unexpected breaks from upstream changes.

WORKDIR /app
# Sets the working directory inside the container so subsequent commands use consistent relative paths.
# Keeps image structure predictable (all app files live under /app).

COPY package*.json ./
# Copies dependency manifests first to leverage Docker layer caching.
# If package.json/package-lock.json did not change, the cached npm install layer is reused, speeding rebuilds.

RUN npm install
# Installs application dependencies, including react-scripts for the dev server + HMR (hot module replacement).
# Consider `npm ci` in CI for deterministic installs and faster cold builds.

COPY . .
# Copies the rest of the project (src, public, config) after dependencies are installed.
# This preserves the install cache when only source files change during development.

EXPOSE 5173
# Documents the internal port used by Create React App's dev server (react-scripts start).
# EXPOSE is informational; docker-compose handles actual port publishing.

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
# Launch Vite dev server bound to all interfaces (Docker) on port 5173.
# For production, build static assets (`npm run build`) and serve them with a static server (e.g., Nginx) for performance.
# Tip: When running behind Docker, ensure the dev server binds to 0.0.0.0 (CRA handles this automatically).
# HMR (Hot Module Replacement) is enabled by default in development mode, allowing instant feedback on code changes.
# Ensure your browser is pointed to the correct Docker IP if accessing the dev server from outside the host machine.
