# Production Dockerfile for phase1-web (React + Vite)
# Multi-stage: build with Node, serve static files with nginx.

# ---- Build stage -----------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# VITE_API_BASE is baked into the bundle at build time. Coolify passes it as
# a build arg via "Build Variable" toggle on the env var.
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

# Install dependencies first (cached layer).
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Build the static bundle into /app/dist
COPY . .
RUN npm run build

# ---- Runtime stage --------------------------------------------------------
FROM nginx:alpine AS runtime

# nginx config that serves the SPA correctly (client-side routes fall back
# to index.html so deep links like /leads/5 work).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
