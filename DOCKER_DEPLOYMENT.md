# Docker Deployment Guide - Business Hub Frontend

This guide details how to build, run, and manage the **Business Hub Frontend** (React + Vite + Nginx) in Docker on host port **3005**.

---

## 🔒 Security & Dynamic Environment Variables

- **No Hardcoded Values**: No API URLs, secrets, or ports are baked into the Dockerfile or repository code.
- **Dynamic Runtime Injection**: The backend URL (`VITE_API_BASE_URL`) is supplied via environment variables at runtime. On container boot, `/docker-entrypoint.sh` writes an ephemeral `env-config.js` with your active backend endpoint (defaults to `http://localhost:3004`).
- **Nginx SPA Routing**: Custom Nginx configuration ensures all React Router routes (`/sales`, `/inventory`, `/super-admin`, etc.) work seamlessly without 404s on browser reload.
- **Gzip & Caching**: Assets are compressed and cached, while `index.html` and `env-config.js` have cache-busting headers to reflect updates immediately.

---

## 1. Quick Deployment

### Option A: Using the Automated Deploy Script (Recommended)
```bash
cd business-hub-frontend
./deploy.sh
```

### Option B: Using Docker Compose
```bash
cd business-hub-frontend
docker compose up -d --build
```

### Option C: Using Standalone Docker CLI
```bash
cd business-hub-frontend

# Build image
docker build -t business-hub-frontend .

# Run container mapping host port 3005 -> container port 80
docker run -d \
  --name business-hub-frontend \
  --restart unless-stopped \
  -p 3005:80 \
  -e VITE_API_BASE_URL=http://localhost:3004 \
  business-hub-frontend
```

---

## 2. Verification

Open your web browser and navigate to:
```
http://localhost:3005
```

The frontend will load and communicate with the backend running on `http://localhost:3004`.

---

## 3. Management Commands

```bash
# View container logs
docker logs -f business-hub-frontend

# Stop and remove container
docker compose down
# OR: docker stop business-hub-frontend && docker rm business-hub-frontend
```
