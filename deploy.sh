#!/usr/bin/env bash
# ==========================================================
# Automated Docker Deployment Script for Business Hub Frontend
# Runs container on Port 3005 (Host) -> 80 (Nginx Container)
# ==========================================================

set -e

# Change to frontend directory
cd "$(dirname "$0")"

echo "=========================================================="
echo " Starting Business Hub Frontend Docker Deployment (Port 3005)..."
echo "=========================================================="

# 1. Check Docker availability
if ! command -v docker &> /dev/null; then
  echo "❌ Error: Docker is not installed on this machine."
  echo "To install Docker on Ubuntu, run:"
  echo "  sudo apt update && sudo apt install -y docker.io docker-compose-v2"
  echo "  sudo usermod -aG docker \$USER"
  echo "Then log out and back in to apply group changes."
  exit 1
fi

# 2. Determine docker compose command (v2 plugin or v1 standalone)
if docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  echo "❌ Error: Docker Compose is not available."
  exit 1
fi

echo " Using: $DOCKER_COMPOSE"

# 3. Build fresh Docker image
echo " Building Docker image..."
$DOCKER_COMPOSE build --no-cache

# 4. Start / Restart container in background
echo " Starting container in background on port 3005..."
$DOCKER_COMPOSE up -d --remove-orphans

# 5. Wait for container healthcheck
echo " Waiting for application to initialize on http://localhost:3005..."
ATTEMPTS=0
MAX_ATTEMPTS=20
HEALTHY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  sleep 2
  ATTEMPTS=$((ATTEMPTS+1))
  
  CONTAINER_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' business-hub-frontend 2>/dev/null || echo "\"unknown\"")
  
  if [ "$CONTAINER_STATUS" = "\"healthy\"" ]; then
    HEALTHY=true
    break
  elif [ "$CONTAINER_STATUS" = "\"unhealthy\"" ]; then
    echo "❌ Container reported unhealthy status."
    break
  fi
  echo -n "."
done

echo ""

if [ "$HEALTHY" = true ]; then
  echo "=========================================================="
  echo " Deployment Successful!"
  echo " Frontend running at: http://localhost:3005"
  echo " Connected to Backend: ${VITE_API_BASE_URL:-http://localhost:3004}"
  echo "=========================================================="
  $DOCKER_COMPOSE ps
else
  echo "⚠️  Container is taking longer to respond. Showing recent logs:"
  $DOCKER_COMPOSE logs --tail 30
fi
