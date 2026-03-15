# CareQueue — Deployment Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [First-Time Deployment](#first-time-deployment)
- [Redeploying After Changes](#redeploying-after-changes)
- [Database Migrations & Seeding](#database-migrations--seeding)
- [Health Check](#health-check)
- [Useful Commands](#useful-commands)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Docker + Docker Compose installed on the server
- Git access to the repository
- Ports `3000` (web) and `3001` (api) open on the server firewall

---

## Environment Variables

Create a `.env` file inside the `infra/` directory on the server. This file is **not committed** to git.

```env
# Required
JWT_SECRET=your-strong-random-secret

# Frontend URL (used for CORS and password reset emails)
FRONTEND_URL=http://<your-server-ip>:3000

# API URL baked into the Next.js frontend bundle at build time
NEXT_PUBLIC_API_URL=http://<your-server-ip>:3001/api/v1

# SMTP (optional — only needed for email notifications / forgot password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@carequeue.com

# Optional port overrides (defaults shown)
API_PORT=3001
WEB_PORT=3000
```

> **Important:** `NEXT_PUBLIC_API_URL` is baked into the Next.js bundle **at build time**.
> If you change this value you must rebuild the `web` container.

---

## First-Time Deployment

```bash
# 1. Clone the repo
git clone https://github.com/bacancy-technology/carequeue-app.git
cd carequeue-app

# 2. Create the env file
cp infra/.env.example infra/.env   # then edit with your values
# (if no .env.example exists, create infra/.env manually — see above)

# 3. Build all images
docker compose -f infra/docker-compose.yml build

# 4. Start all services
docker compose -f infra/docker-compose.yml up -d

# 5. Run database migrations
docker compose -f infra/docker-compose.yml exec api npx prisma migrate deploy

# 6. Seed default users
docker compose -f infra/docker-compose.yml exec api \
  npx ts-node --transpile-only --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# 7. Verify everything is running
docker compose -f infra/docker-compose.yml ps
```

After this:
- Web UI → `http://<your-server-ip>:3000`
- API → `http://<your-server-ip>:3001/api/v1`
- Health check → `http://<your-server-ip>:3001/api/v1/health`

---

## Redeploying After Changes

### Backend changes only (API)

```bash
git pull origin main
docker compose -f infra/docker-compose.yml build api
docker compose -f infra/docker-compose.yml up -d api
```

### Frontend changes only (Web)

```bash
git pull origin main
docker compose -f infra/docker-compose.yml build web
docker compose -f infra/docker-compose.yml up -d web
```

### Both frontend and backend changed

```bash
git pull origin main
docker compose -f infra/docker-compose.yml build api web
docker compose -f infra/docker-compose.yml up -d api web
```

### Full rebuild (all services, no cache)

Use this when you suspect a stale build (e.g. dependency changes, Dockerfile changes):

```bash
git pull origin main
docker compose -f infra/docker-compose.yml build --no-cache
docker compose -f infra/docker-compose.yml up -d
```

> After any rebuild of the `web` container, no further steps are needed — static assets are rebuilt automatically.

---

## Database Migrations & Seeding

### Apply pending migrations (run after every deploy that includes schema changes)

```bash
docker compose -f infra/docker-compose.yml exec api npx prisma migrate deploy
```

### Run the seed (safe to run multiple times — uses upsert)

```bash
docker compose -f infra/docker-compose.yml exec api \
  npx ts-node --transpile-only --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### Check existing users in the database

```bash
docker compose -f infra/docker-compose.yml exec postgres \
  psql -U postgres -d carequeue -c 'SELECT email, role, "isActive" FROM "User";'
```

### Default seed credentials

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@carequeue.com | Admin@123 |
| CLINIC_STAFF | staff@carequeue.com | Staff@123 |
| DOCTOR | dr.smith@carequeue.com | Doctor@123 |
| DOCTOR | dr.patel@carequeue.com | Doctor@123 |
| PATIENT | patient@carequeue.com | Patient@123 |

---

## Health Check

```bash
curl http://<your-server-ip>:3001/api/v1/health
```

Expected response:
```json
{ "status": "ok", "db": "connected", "timestamp": "2026-03-15T12:00:00.000Z" }
```

If `db` is not `"connected"` the API cannot reach PostgreSQL — check that the `postgres` container is running.

---

## Useful Commands

```bash
# View logs for a specific service
docker compose -f infra/docker-compose.yml logs -f api
docker compose -f infra/docker-compose.yml logs -f web

# View logs for all services
docker compose -f infra/docker-compose.yml logs -f

# Restart a single service without rebuilding
docker compose -f infra/docker-compose.yml restart api

# Stop all services
docker compose -f infra/docker-compose.yml down

# Stop and remove volumes (WARNING: deletes all DB data)
docker compose -f infra/docker-compose.yml down -v

# List running containers
docker compose -f infra/docker-compose.yml ps

# Open a shell inside the API container
docker compose -f infra/docker-compose.yml exec api sh

# Open a psql session
docker compose -f infra/docker-compose.yml exec postgres psql -U postgres -d carequeue
```

---

## Troubleshooting

### API crashes with `libssl.so.1.1: No such file or directory`

OpenSSL 1.1 is missing from the image. Rebuild with `--no-cache`:
```bash
docker compose -f infra/docker-compose.yml build --no-cache api
docker compose -f infra/docker-compose.yml up -d api
```

### Login still calls `localhost:3001` in the browser

`NEXT_PUBLIC_API_URL` is baked into the Next.js bundle at build time. Ensure the value is set in `infra/.env`, then **rebuild** the web container:
```bash
docker compose -f infra/docker-compose.yml build --no-cache web
docker compose -f infra/docker-compose.yml up -d web
```

### `ts-node` fails with `Unknown file extension ".ts"`

The container runtime doesn't have TypeScript configured for ESM. Use the flags below:
```bash
npx ts-node --transpile-only --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### Database `clinic_scheduler` does not exist

The database name is `carequeue`. Use `-d carequeue` in all `psql` commands.

### Migrations show `No pending migrations to apply`

This is normal if no new migrations were added in the latest commit. No action needed.

### Container exits immediately after starting

Check the logs for the specific error:
```bash
docker compose -f infra/docker-compose.yml logs api
```
