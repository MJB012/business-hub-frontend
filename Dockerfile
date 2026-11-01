# ==========================================================
# Multi-Stage Production Dockerfile for Business Hub Frontend
# Node.js 22 (Alpine) -> Nginx Alpine
# ==========================================================

# ----------------------------------------------------------
# Stage 1: Build the React Application
# ----------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy configuration and source files
COPY tsconfig*.json vite.config.ts index.html ./
COPY src/ ./src/
COPY public/ ./public/

# Compile React SPA to dist/
RUN npm run build

# ----------------------------------------------------------
# Stage 2: Production Web Server (Nginx)
# ----------------------------------------------------------
FROM nginx:alpine AS production

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled assets from builder
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script for dynamic runtime env injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose HTTP port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
