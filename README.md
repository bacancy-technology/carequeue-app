# CareQueue — Clinic Scheduler

A full-stack clinic appointment scheduling platform built as a production-ready monorepo. CareQueue enables clinics to manage doctors, patients, appointments, and notifications in one unified interface.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Database Migrations](#database-migrations)
- [User Roles & Access](#user-roles--access)
- [API Overview](#api-overview)
- [Deployment (EC2 with Docker)](#deployment-ec2-with-docker)
- [Useful Commands](#useful-commands)

---

## Features

- **Authentication** — JWT-based login, registration, forgot/reset password with email
- **Role-Based Access Control** — Admin, Clinic Staff, Doctor, Patient roles
- **Patient Management** — Full CRUD, patient notes, medical history
- **Doctor Management** — Profiles, weekly availability, leave/blocked dates
- **Appointment Scheduling** — Book, reschedule, cancel, complete with conflict detection
- **Calendar View** — FullCalendar integration with month/week/day views
- **Dashboard** — Role-specific stats and quick actions
- **Notifications** — In-app notification center + email notifications via SMTP
- **Profile Management** — Patients and doctors can update their own profiles

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TailwindCSS v4, shadcn/ui |
| Backend | NestJS 11, Prisma 5, Passport JWT |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7, Bull |
| Email | Nodemailer (SMTP) |
| Containerization | Docker, Docker Compose |
| Monorepo | npm workspaces + Turborepo |
| Language | TypeScript (strict) |

---

## Project Structure

```
carequeue/
├── apps/
│   ├── api/                    # NestJS REST API (port 3001)
│   │   ├── src/
│   │   │   ├── auth/           # JWT auth, login, register, password reset
│   │   │   ├── users/          # User entity management
│   │   │   ├── patients/       # Patient CRUD + notes
│   │   │   ├── doctors/        # Doctor CRUD + availability + leave
│   │   │   ├── appointments/   # Booking, reschedule, cancel, complete
│   │   │   ├── notifications/  # In-app + email notifications
│   │   │   ├── dashboard/      # Role-scoped stats
│   │   │   └── prisma/         # PrismaService (global module)
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── migrations/     # Migration history
│   │   └── Dockerfile
│   └── web/                    # Next.js frontend (port 3000)
│       ├── app/
│       │   ├── (dashboard)/    # Authenticated pages (Sidebar layout)
│       │   │   ├── dashboard/
│       │   │   ├── patients/
│       │   │   ├── doctors/
│       │   │   ├── appointments/
│       │   │   ├── notifications/
│       │   │   ├── profile/
│       │   │   └── settings/
│       │   ├── login/
│       │   ├── register/
│       │   ├── forgot-password/
│       │   └── reset-password/
│       ├── components/
│       │   └── ui/             # shadcn/ui components + custom components
│       ├── lib/
│       │   ├── api/            # Axios API client modules
│       │   └── auth-context.tsx
│       └── Dockerfile
├── packages/
│   ├── types/                  # Shared TypeScript types
│   └── ui/                     # Shared UI component library
├── infra/
│   └── docker-compose.yml      # All services orchestration
├── .env.example                # Environment variable template
└── turbo.json                  # Turborepo pipeline config
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | >= 20.0.0 (22.0.0 tested) |
| npm | >= 10.x |
| Docker Desktop | Latest |
| Git | Any recent version |

> **Note:** Prisma 5 is used because Prisma 6 requires Node.js 22.12+. If you upgrade Node to 22.12+ or use 20.19+, you can upgrade to Prisma 6.

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone <repository-url> carequeue
cd carequeue
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
# Copy the example file
cp .env.example apps/api/.env

# Edit with your values
nano apps/api/.env
```

Also create the web env file:

```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1' > apps/web/.env.local
```

### 4. Start PostgreSQL and Redis via Docker

```bash
cd infra
docker compose up -d postgres redis
cd ..
```

### 5. Run database migrations

```bash
cd apps/api
npx prisma migrate dev
cd ../..
```

### 6. Generate Prisma client

```bash
cd apps/api
npx prisma generate
cd ../..
```

---

## Environment Variables

### `apps/api/.env`

```dotenv
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/carequeue?schema=public"

# App
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="CareQueue <no-reply@carequeue.app>"
```

### `apps/web/.env.local`

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## Running the App

### Development (all services)

```bash
npm run dev
```

This starts both the API and Web app in watch mode using Turborepo.

### Individual services

```bash
# API only
cd apps/api && npm run start:dev

# Web only
cd apps/web && npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- API: http://localhost:3001/api/v1

---

## Database Migrations

```bash
# Create and apply a new migration
cd apps/api
npx prisma migrate dev --name <migration-name>

# Apply existing migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (DB browser)
npx prisma studio

# Reset DB (drops all data — dev only)
npx prisma migrate reset
```

---

## User Roles & Access

| Role | Description |
|---|---|
| `ADMIN` | Full access — manage all users, doctors, patients, appointments |
| `CLINIC_STAFF` | Manage patients and appointments; view doctors |
| `DOCTOR` | View own schedule, manage own availability, complete appointments |
| `PATIENT` | Book appointments, view own appointments, update own profile |

**Default role on registration:** `PATIENT`

To create an admin user, insert directly into the database (see [Deployment guide](#deployment-ec2-with-docker)).

---

## API Overview

All routes are prefixed with `/api/v1`. Authentication uses Bearer JWT tokens.

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| GET | `/auth/me` | Authenticated |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public |

### Patients
| Method | Endpoint | Access |
|---|---|---|
| POST | `/patients` | ADMIN, CLINIC_STAFF |
| GET | `/patients` | ADMIN, CLINIC_STAFF, DOCTOR |
| GET | `/patients/me` | PATIENT |
| GET | `/patients/:id` | ADMIN, CLINIC_STAFF, DOCTOR |
| PATCH | `/patients/:id` | ADMIN, CLINIC_STAFF |
| PATCH | `/patients/me` | PATIENT |
| DELETE | `/patients/:id` | ADMIN |
| POST | `/patients/:id/notes` | ADMIN, CLINIC_STAFF, DOCTOR |
| GET | `/patients/:id/notes` | ADMIN, CLINIC_STAFF, DOCTOR |
| DELETE | `/patients/:id/notes/:noteId` | Note author or ADMIN |

### Doctors
| Method | Endpoint | Access |
|---|---|---|
| POST | `/doctors` | ADMIN |
| GET | `/doctors` | ADMIN, CLINIC_STAFF, PATIENT |
| GET | `/doctors/me` | DOCTOR |
| GET | `/doctors/:id` | ADMIN, CLINIC_STAFF |
| PATCH | `/doctors/:id` | ADMIN |
| PATCH | `/doctors/me` | DOCTOR |
| DELETE | `/doctors/:id` | ADMIN |
| GET | `/doctors/:id/availability` | All roles |
| POST | `/doctors/:id/availability` | ADMIN, DOCTOR |
| GET | `/doctors/:id/available-slots` | All roles |
| POST | `/doctors/:id/leave` | ADMIN, DOCTOR |
| GET | `/doctors/:id/leave` | ADMIN, DOCTOR |
| DELETE | `/doctors/:id/leave/:leaveId` | ADMIN, DOCTOR |

### Appointments
| Method | Endpoint | Access |
|---|---|---|
| POST | `/appointments` | All authenticated |
| GET | `/appointments` | Role-scoped |
| GET | `/appointments/calendar` | Role-scoped |
| GET | `/appointments/:id` | Role-scoped |
| PATCH | `/appointments/:id` | Role-scoped |
| PATCH | `/appointments/:id/reschedule` | Role-scoped |
| PATCH | `/appointments/:id/cancel` | Role-scoped |
| PATCH | `/appointments/:id/complete` | ADMIN, CLINIC_STAFF, DOCTOR |

### Dashboard
| Method | Endpoint | Access |
|---|---|---|
| GET | `/dashboard/stats` | All authenticated (role-scoped) |

---

## Deployment (EC2 with Docker)

### Requirements on the server
- Ubuntu 20.04+ or Amazon Linux 2
- Docker + Docker Compose plugin installed
- Ports 3000 and 3001 open in the EC2 Security Group

### Step 1 — SSH into the instance

```bash
ssh <USERNAME>@<EC2_IP>
```

### Step 2 — Install Docker

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker
```

### Step 3 — Transfer code to the server

```bash
# From your local machine
scp -r ./clinic-scheduler <USERNAME>@<EC2_IP>:~/carequeue
```

Or clone from Git:

```bash
git clone <repository-url> ~/carequeue
```

### Step 4 — Update docker-compose for production

Edit `infra/docker-compose.yml` and replace `http://api:3001` with `http://<EC2_IP>:3001` in the web service's `NEXT_PUBLIC_API_URL`, and add `FRONTEND_URL: http://<EC2_IP>:3000` to the api service.

### Step 5 — Create production `.env`

```bash
cat > ~/carequeue/infra/.env << EOF
JWT_SECRET=your_strong_random_secret_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="CareQueue <no-reply@carequeue.app>"
EOF
```

### Step 6 — Build and start

```bash
cd ~/carequeue/infra
docker compose up -d --build
```

### Step 7 — Run migrations

```bash
docker compose exec api npx prisma migrate deploy
```

### Step 8 — Access the app

- Frontend: `http://<EC2_IP>:3000`
- API: `http://<EC2_IP>:3001/api/v1`

---

## Useful Commands

```bash
# Start infrastructure (DB + Redis only)
cd infra && docker compose up -d postgres redis

# View all running containers
docker compose ps

# Tail logs for a service
docker compose logs -f api
docker compose logs -f web

# Restart a service
docker compose restart api

# Stop all services
docker compose down

# Stop and remove volumes (wipes DB — destructive!)
docker compose down -v

# Open Prisma Studio
cd apps/api && npx prisma studio

# Run full build via Turborepo
npm run build

# Format all code
npm run format

# Lint all code
npm run lint
```
