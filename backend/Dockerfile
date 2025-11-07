# Dockerfile (backend) — Development oriented:
# - Runs Node with nodemon for hot-reload in a container.
# - Build layering optimized for faster rebuilds on code changes.
# - In production, switch to `node src/server.js` and NODE_ENV=production.

FROM node:18
# Base Node 18 LTS image suitable for ESM, secure defaults, and broad npm ecosystem support.

WORKDIR /app
# Normalizes path context for subsequent instructions (COPY/RUN/CMD) and makes the image layout predictable.

COPY package*.json ./
# Copies only dependency manifests to maximize cache hits for the install layer between code changes.

RUN npm install
# Installs production and dev dependencies. Nodemon (in devDependencies) is required for hot reload in development.
# In CI/production, prefer `npm ci` and `NODE_ENV=production` to install only prod deps.

COPY . .
# Copies backend application source and config into the image.
# In docker-compose with a bind mount, live code changes will override these files for hot reload.

EXPOSE 4000
# Document the internal port used by Express (PORT defaults to 4000).

CMD ["npm", "run", "dev"]
# Starts the development server via nodemon (typically "nodemon src/server.js"), auto-restarting on file changes.
# For production, switch to "node src/server.js" and tune NODE_ENV for performance and security.
# Compose should inject PORT and MONGO_URI via environment for connectivity to the mongo service.
