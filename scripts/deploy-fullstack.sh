#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env.docker}"
COMPOSE_FILE="docker-compose.full.yml"
APP_URL="${APP_URL:-}"
RESET_DB="${RESET_DB:-0}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}Docker is required but not installed.${NC}"
  exit 1
fi

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
else
  echo -e "${RED}Docker Compose is required but not installed.${NC}"
  exit 1
fi

generate_secret() {
  openssl rand -base64 32 | tr -d '\n'
}

write_env_file() {
  local initial_app_url
  local jwt_secret
  local refresh_secret
  local db_password
  initial_app_url="${APP_URL:-http://localhost:8080}"
  jwt_secret="$(generate_secret)"
  refresh_secret="$(generate_secret)"
  db_password="$(openssl rand -hex 18)"

  cat > "$ENV_FILE" <<EOF
PROJECT_NAME=alumni-portal
NODE_ENV=production

FRONTEND_PORT=8080
BACKEND_PORT=5000
DB_PORT=5432

DB_USER=postgres
DB_PASSWORD=${db_password}
DB_NAME=alumni_portal

JWT_SECRET=${jwt_secret}
JWT_REFRESH_SECRET=${refresh_secret}
FRONTEND_URL=${initial_app_url}
EOF
}

load_env_file() {
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
}

is_port_in_use() {
  local port="$1"
  lsof -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
}

find_free_port() {
  local port="$1"
  while is_port_in_use "$port"; do
    port=$((port + 1))
  done
  echo "$port"
}

echo -e "${BLUE}==> Alumni Portal Full-Stack Deployment${NC}"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}Creating ${ENV_FILE} with production defaults...${NC}"
  write_env_file
  chmod 600 "$ENV_FILE"
fi

load_env_file

FRONTEND_PORT="${FRONTEND_PORT:-8080}"
BACKEND_PORT="${BACKEND_PORT:-5000}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-password}"
DB_NAME="${DB_NAME:-alumni_portal}"

if is_port_in_use "$FRONTEND_PORT"; then
  new_port="$(find_free_port "$FRONTEND_PORT")"
  echo -e "${YELLOW}Port ${FRONTEND_PORT} is busy. Using ${new_port} for frontend.${NC}"
  FRONTEND_PORT="$new_port"
fi

if is_port_in_use "$BACKEND_PORT"; then
  new_port="$(find_free_port "$BACKEND_PORT")"
  echo -e "${YELLOW}Port ${BACKEND_PORT} is busy. Using ${new_port} for backend.${NC}"
  BACKEND_PORT="$new_port"
fi

if is_port_in_use "$DB_PORT"; then
  new_port="$(find_free_port "$DB_PORT")"
  echo -e "${YELLOW}Port ${DB_PORT} is busy. Using ${new_port} for database.${NC}"
  DB_PORT="$new_port"
fi

if [ -z "$APP_URL" ]; then
  APP_URL="http://localhost:${FRONTEND_PORT}"
fi

export FRONTEND_PORT BACKEND_PORT DB_PORT FRONTEND_URL="$APP_URL"

echo -e "${BLUE}Using env file:${NC} ${ENV_FILE}"

echo -e "${BLUE}Preparing containers...${NC}"
if [ "$RESET_DB" = "1" ]; then
  echo -e "${YELLOW}RESET_DB=1 detected. Removing database volume for a clean start.${NC}"
  "${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v --remove-orphans || true
else
  "${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down --remove-orphans || true
fi

echo -e "${BLUE}Building backend and frontend images...${NC}"
"${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build backend frontend

echo -e "${BLUE}Starting database...${NC}"
"${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build database

echo -e "${BLUE}Waiting for database readiness...${NC}"
for _ in {1..40}; do
  if "${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T database pg_isready -U "${DB_USER:-postgres}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! "${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T database pg_isready -U "${DB_USER:-postgres}" >/dev/null 2>&1; then
  echo -e "${RED}Database readiness check failed.${NC}"
  DB_LOGS="$("${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=200 database || true)"
  echo "$DB_LOGS"

  if echo "$DB_LOGS" | grep -qi "No space left on device"; then
    echo -e "${YELLOW}Detected Docker storage exhaustion.${NC}"
    echo -e "${YELLOW}Free Docker space and retry:${NC}"
    echo "  1) ${COMPOSE_CMD[*]} --env-file $ENV_FILE -f $COMPOSE_FILE down -v --remove-orphans"
    echo "  2) docker system prune -af --volumes"
    echo "  3) Increase Docker Desktop disk image size (Settings -> Resources) if needed"
  fi

  exit 1
fi

INTERNAL_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@database:5432/${DB_NAME}"

echo -e "${BLUE}Running database migrations...${NC}"
"${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm -e DATABASE_URL="$INTERNAL_DATABASE_URL" backend npx prisma migrate deploy

echo -e "${BLUE}Seeding database (safe to skip if no seed changes)...${NC}"
"${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm -e DATABASE_URL="$INTERNAL_DATABASE_URL" backend npx prisma db seed || true

echo -e "${BLUE}Starting backend and frontend...${NC}"
"${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build backend frontend

echo -e "${BLUE}Waiting for services to become healthy...${NC}"
for _ in {1..30}; do
  if curl -fsS "http://localhost:${BACKEND_PORT}/api/status/health" >/dev/null 2>&1 && curl -fsS "http://localhost:${FRONTEND_PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! curl -fsS "http://localhost:${BACKEND_PORT}/api/status/health" >/dev/null 2>&1; then
  echo -e "${RED}Backend health check failed.${NC}"
  "${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=200 backend
  exit 1
fi

if ! curl -fsS "http://localhost:${FRONTEND_PORT}/" >/dev/null 2>&1; then
  echo -e "${RED}Frontend health check failed.${NC}"
  "${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=200 frontend
  exit 1
fi

echo -e "${GREEN}Deployment successful.${NC}"
echo -e "${GREEN}Frontend:${NC} http://localhost:${FRONTEND_PORT}"
echo -e "${GREEN}Backend:${NC} http://localhost:${BACKEND_PORT}/api"
echo -e "${GREEN}Health:${NC} http://localhost:${BACKEND_PORT}/api/status/health"
