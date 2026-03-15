# CareQueue — Technical Architecture

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Monorepo Structure](#monorepo-structure)
- [Backend Architecture (NestJS API)](#backend-architecture-nestjs-api)
- [Frontend Architecture (Next.js)](#frontend-architecture-nextjs)
- [Database Design](#database-design)
- [Authentication & Authorization](#authentication--authorization)
- [Notification System](#notification-system)
- [Appointment Scheduling Logic](#appointment-scheduling-logic)
- [Docker & Infrastructure](#docker--infrastructure)
- [Data Flow Diagrams](#data-flow-diagrams)
- [API Request Lifecycle](#api-request-lifecycle)
- [Environment Configuration](#environment-configuration)
- [Security Considerations](#security-considerations)

---

## System Overview

CareQueue is a multi-role clinic appointment scheduling platform. It provides a REST API backend and a server-side-rendered frontend, deployed as Docker containers behind a shared network.

**Core domains:**
- Identity & Access Management (Users, Roles, JWT)
- Patient Management (profiles, notes, history)
- Doctor Management (profiles, weekly availability, leave)
- Appointment Scheduling (booking, conflict detection, status lifecycle)
- Notifications (in-app + transactional email)
- Reporting (role-scoped dashboard stats)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                        │
│                     Next.js 15 — port 3000                       │
│         React 19 │ TailwindCSS │ shadcn/ui │ Axios              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (REST JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NestJS API — port 3001                       │
│              /api/v1/*  (JWT-protected, role-scoped)             │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ ┌───────────────┐   │
│  │   Auth   │ │ Patients │ │   Doctors   │ │ Appointments  │   │
│  └──────────┘ └──────────┘ └─────────────┘ └───────────────┘   │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Notifications   │  │  Dashboard   │  │   PrismaService   │  │
│  └──────────────────┘  └──────────────┘  └───────────────────┘  │
└──────────────────────────┬──────────────────────┬───────────────┘
                           │                      │
              ┌────────────▼──────────┐  ┌────────▼────────────┐
              │   PostgreSQL 16       │  │     Redis 7          │
              │   (persistent data)   │  │  (job queue cache)   │
              └───────────────────────┘  └─────────────────────┘
                                                  │
                                     ┌────────────▼────────────┐
                                     │   Bull Queue Workers     │
                                     │   (email delivery)       │
                                     └─────────────────────────┘
                                                  │
                                     ┌────────────▼────────────┐
                                     │   SMTP Server            │
                                     │   (Gmail / Mailtrap)     │
                                     └─────────────────────────┘
```

---

## Monorepo Structure

The repository uses **npm workspaces** with **Turborepo** for pipeline orchestration.

```
carequeue/                          # Root workspace
├── apps/
│   ├── api/                        # @carequeue/api  — NestJS backend
│   └── web/                        # @carequeue/web  — Next.js frontend
├── packages/
│   ├── types/                      # Shared TypeScript type definitions
│   └── ui/                         # Shared React component library
├── infra/
│   └── docker-compose.yml          # Container orchestration
├── turbo.json                      # Turborepo pipeline (build → lint → test)
└── package.json                    # Workspace root
```

**Turborepo pipeline** (`turbo.json`):
- `build` — compiles API (tsc) and Web (next build) in dependency order
- `dev` — runs both apps in parallel watch mode
- `lint` — runs ESLint across all packages
- `test` — runs Jest in the API app

---

## Backend Architecture (NestJS API)

### Module Map

```
AppModule
├── ConfigModule        (global — env vars)
├── PrismaModule        (global — database client)
├── AuthModule
│   ├── JwtModule
│   ├── PassportModule
│   ├── UsersModule
│   └── EmailModule
├── PatientsModule
├── DoctorsModule
├── AppointmentsModule
├── NotificationsModule
│   └── BullModule (email queue)
└── DashboardModule
```

### Global Providers

| Provider | Type | Description |
|---|---|---|
| `PrismaService` | `@Global()` module | Single Prisma client instance; injectable anywhere |
| `ConfigService` | `@Global()` module | Access to `process.env` with validation |
| `JwtAuthGuard` | `APP_GUARD` | Applies JWT authentication to all routes globally |
| `RolesGuard` | `APP_GUARD` | Enforces `@Roles()` decorator on protected routes |
| `GlobalExceptionFilter` | `APP_FILTER` | Normalizes all errors to consistent JSON responses |

### Route Protection Pattern

```typescript
// Public endpoint — skip JWT check
@Public()
@Post('auth/login')

// Role-restricted endpoint
@Roles(Role.ADMIN, Role.CLINIC_STAFF)
@Get('patients')

// Default — JWT required, no role restriction
@Get('auth/me')
```

### Request Flow

```
HTTP Request
    │
    ▼
JwtAuthGuard          — validates Bearer token, attaches req.user
    │
    ▼
RolesGuard            — checks @Roles() decorator against req.user.role
    │
    ▼
ValidationPipe        — validates & transforms DTO (class-validator)
    │
    ▼
Controller            — routes to correct service method
    │
    ▼
Service               — business logic, calls PrismaService
    │
    ▼
PrismaService         — executes SQL via Prisma ORM
    │
    ▼
PostgreSQL            — returns data
    │
    ▼
Response serialized → JSON
```

### Module Responsibilities

| Module | Responsibilities |
|---|---|
| `AuthModule` | Register, login, JWT issuance, forgot/reset password, invite flow |
| `UsersModule` | User CRUD, password hashing (bcryptjs) |
| `PatientsModule` | Patient CRUD, patient notes, self-profile update |
| `DoctorsModule` | Doctor CRUD, weekly availability upsert, leave/blocked dates, available-slots generation |
| `AppointmentsModule` | Booking with overlap detection, reschedule, cancel, complete, calendar feed |
| `NotificationsModule` | In-app notification CRUD, Bull queue for async email dispatch |
| `EmailModule` | Nodemailer wrapper; sends transactional HTML emails |
| `DashboardModule` | Aggregated statistics scoped by requester's role |

---

## Frontend Architecture (Next.js)

### App Router Structure

```
app/
├── layout.tsx                      # Root layout (font, providers, metadata)
├── page.tsx                        # Root redirect → /dashboard or /login
├── providers.tsx                   # QueryClientProvider + AuthProvider + ToastProvider
│
├── login/page.tsx                  # Public — CareQueue login
├── register/page.tsx               # Public — Patient self-registration
├── forgot-password/page.tsx        # Public — request reset email
├── reset-password/page.tsx         # Public — consume token, set new password
├── invite/accept/page.tsx          # Public — accept staff/doctor invite
│
└── (dashboard)/                    # Route group — shared Sidebar layout
    ├── layout.tsx                  # Sidebar + main content wrapper
    ├── dashboard/page.tsx          # Role-scoped stats + quick actions
    ├── patients/
    │   ├── page.tsx                # Patient list + search
    │   ├── new/page.tsx            # Create patient
    │   └── [id]/
    │       ├── page.tsx            # Patient detail + notes + appointments
    │       └── edit/page.tsx       # Edit patient
    ├── doctors/
    │   ├── page.tsx                # Doctor list + search + specialization filter
    │   ├── new/page.tsx            # Create doctor
    │   └── [id]/
    │       ├── page.tsx            # Doctor detail + leave management
    │       ├── edit/page.tsx       # Edit doctor
    │       └── availability/page.tsx  # Weekly availability grid
    ├── appointments/
    │   ├── page.tsx                # Appointment list (role-scoped)
    │   ├── new/page.tsx            # Book appointment
    │   ├── calendar/page.tsx       # FullCalendar month/week/day view
    │   └── [id]/page.tsx           # Appointment detail + actions
    ├── notifications/page.tsx      # Notification center
    ├── profile/page.tsx            # Role-aware profile editor
    └── settings/page.tsx           # App settings
```

### State Management

| Layer | Tool | Purpose |
|---|---|---|
| Server state | TanStack Query v5 | API data fetching, caching, refetching |
| Auth state | React Context (`AuthContext`) | Current user, token, login/logout |
| Form state | React Hook Form + Zod | Form validation and submission |
| UI state | Local `useState` | Modals, tabs, toggles |

### API Client (`lib/api/`)

All API calls go through a shared Axios instance:

```
lib/api/
├── index.ts            # Axios instance; reads token from localStorage; attaches Bearer header
├── auth.ts             # login, register, forgotPassword, resetPassword
├── patients.ts         # CRUD + notes
├── doctors.ts          # CRUD + availability + leaves + slots
├── appointments.ts     # CRUD + reschedule + cancel + complete + calendar
├── notifications.ts    # list, markRead, markAllRead
└── dashboard.ts        # stats
```

### Auth Flow

```
User visits protected route
        │
        ▼
middleware.ts checks cookie 'accessToken'
        │
   No token? ──────────────────► redirect to /login
        │
   Token exists
        ▼
Page renders, AuthContext.useEffect fires
        │
        ▼
GET /api/v1/auth/me  (Bearer token)
        │
   401? ──────────────────────► clear token, redirect to /login
        │
   200 — set user in context
        ▼
Page renders with user data
```

---

## Database Design

### Entity Relationship Diagram

```
users
  │id (PK, cuid)
  │email (unique)
  │passwordHash
  │firstName, lastName
  │role: ADMIN | CLINIC_STAFF | DOCTOR | PATIENT
  │isActive
  │
  ├──────────────── patients (1:1, cascade delete)
  │                   │id, userId (FK)
  │                   │dateOfBirth, gender, phone, address
  │                   │emergencyContact, medicalHistory
  │                   │
  │                   ├── patient_notes (1:N, cascade delete)
  │                   │     id, patientId, content, createdBy (userId)
  │                   │
  │                   └── appointments (1:N)
  │
  ├──────────────── doctors (1:1, cascade delete)
  │                   │id, userId (FK)
  │                   │specialization, licenseNumber (unique)
  │                   │phone, bio
  │                   │
  │                   ├── doctor_availability (1:N, cascade delete)
  │                   │     id, doctorId, dayOfWeek (0-6)
  │                   │     startTime, endTime, isAvailable
  │                   │     UNIQUE(doctorId, dayOfWeek)
  │                   │
  │                   ├── doctor_leaves (1:N, cascade delete)
  │                   │     id, doctorId, date, reason
  │                   │     UNIQUE(doctorId, date)
  │                   │
  │                   └── appointments (1:N)
  │
  ├──────────────── notifications (1:N, cascade delete)
  │                   id, userId, appointmentId?, type
  │                   subject, message, isRead, sentAt
  │
  └──────────────── password_reset_tokens (1:N, cascade delete)
                      id, userId, token (unique), expiresAt, used, isInvite

appointments
  id (PK, cuid)
  patientId (FK → patients)
  doctorId  (FK → doctors)
  scheduledAt (DateTime)
  duration (Int, minutes, default 30)
  status: SCHEDULED | RESCHEDULED | CANCELLED | COMPLETED
  reason, notes, cancellationReason
```

### Key Constraints

| Constraint | Location | Description |
|---|---|---|
| `UNIQUE(doctorId, dayOfWeek)` | `doctor_availability` | One availability record per day per doctor |
| `UNIQUE(doctorId, date)` | `doctor_leaves` | One leave record per date per doctor |
| `UNIQUE(licenseNumber)` | `doctors` | Medical license must be globally unique |
| `UNIQUE(email)` | `users` | No duplicate accounts |
| `UNIQUE(token)` | `password_reset_tokens` | Reset tokens are unique |

---

## Authentication & Authorization

### JWT Strategy

- Token type: Bearer JWT (signed with `JWT_SECRET`)
- Expiry: configurable via `JWT_EXPIRES_IN` (default `7d`)
- Payload: `{ sub: userId, email, role }`
- Storage: `localStorage` (web) / `cookie` (middleware SSR check)

### Guard Execution Order

```
Request
  └─► JwtAuthGuard (global)
        ├── @Public() decorator? → skip, allow through
        └── Validate token → attach req.user
              └─► RolesGuard (global)
                    ├── No @Roles() decorator? → allow through
                    └── Check req.user.role ∈ allowed roles
                          ├── Match → proceed to controller
                          └── No match → 403 Forbidden
```

### Password Security

- Hashing: `bcryptjs` with salt rounds = 10
- Reset flow: cryptographically random token stored in `password_reset_tokens` with 1-hour expiry
- Tokens are single-use (`used` flag set on consumption)

---

## Notification System

### Architecture

```
Service (e.g. AppointmentsService)
    │
    │ calls NotificationsService.createAndQueue(...)
    ▼
NotificationsService
    ├── Creates Notification record in PostgreSQL (in-app)
    └── Adds job to Bull queue (Redis)
              │
              ▼
        EmailProcessor (Bull worker)
              │
              ▼
        EmailService.sendMail(...)
              │
              ▼
        Nodemailer → SMTP Server
```

### Notification Types

| Type | Trigger | Channel |
|---|---|---|
| Appointment booked | New appointment created | In-app + Email |
| Appointment rescheduled | Reschedule action | In-app + Email |
| Appointment cancelled | Cancel action | In-app + Email |
| Password reset | Forgot password request | Email only |

---

## Appointment Scheduling Logic

### Availability Resolution

```
GET /doctors/:id/available-slots?date=YYYY-MM-DD&slotDuration=30

1. Look up DoctorAvailability for dayOfWeek(date)
   └── Not found or isAvailable=false → return []

2. Check DoctorLeave for exact date
   └── Leave exists → return []

3. Generate time slots from startTime to endTime with slotDuration
   e.g. 09:00–17:00, 30min → [09:00, 09:30, 10:00, ..., 16:30]

4. Load existing bookings (status IN [SCHEDULED, RESCHEDULED]) for that doctor on that date

5. For each slot, check overlap:
   overlap = slotStart < bookingEnd && slotEnd > bookingStart

6. Return slots where no overlap found
```

### Double-Booking Prevention

Checked at both **booking** and **rescheduling** for:
- Doctor conflicts (same doctor, overlapping time)
- Patient conflicts (same patient, overlapping time)

```
overlap condition:
  newStart < existingEnd  AND  newEnd > existingStart
```

### Appointment Status Lifecycle

```
          ┌──────────────────────┐
          │        BOOK          │
          └──────────┬───────────┘
                     ▼
               SCHEDULED ──────────────────► CANCELLED
                     │                           (any role with access)
                     ▼
              RESCHEDULED ─────────────────► CANCELLED
                     │
                     ▼
               COMPLETED
           (ADMIN / STAFF / DOCTOR only)

Rules:
- COMPLETED and CANCELLED appointments are immutable
- Rescheduling creates a status update on the same record (not a new record)
- Cancellation captures optional cancellationReason
```

---

## Docker & Infrastructure

### Services

| Container | Image | Port | Purpose |
|---|---|---|---|
| `carequeue_postgres` | `postgres:16-alpine` | 5432 | Primary relational database |
| `carequeue_redis` | `redis:7-alpine` | 6379 | Bull queue broker + cache |
| `carequeue_api` | Built from `apps/api/Dockerfile` | 3001 | NestJS REST API |
| `carequeue_web` | Built from `apps/web/Dockerfile` | 3000 | Next.js SSR frontend |

### API Dockerfile (Multi-stage)

```
Stage 1 — deps:    Install npm dependencies
Stage 2 — builder: Copy deps, run prisma generate, nest build
Stage 3 — runner:  Copy dist/ + node_modules + prisma schema, run node dist/main
```

### Web Dockerfile (Multi-stage)

```
Stage 1 — deps:    Install npm dependencies
Stage 2 — builder: Copy deps, next build (generates .next/standalone)
Stage 3 — runner:  Runs as non-root nextjs user, node server.js (standalone output)
```

### Service Dependencies

```
postgres (healthcheck: pg_isready)
    └─► api (depends_on: postgres healthy, redis started)
            └─► web (depends_on: api started)
redis
    └─► api
```

### Networking

All containers share a default Docker bridge network created by Compose. Internal service communication uses Docker DNS names:
- API → DB: `postgres:5432`
- API → Cache: `redis:6379`
- Web → API (server-side): `api:3001`
- Browser → API (client-side): `<EC2_IP>:3001` (must be public address)

---

## Data Flow Diagrams

### Booking an Appointment

```
Patient (Browser)
    │
    │ POST /api/v1/appointments
    │ { doctorId, scheduledAt, duration, reason }
    ▼
JwtAuthGuard → validates token
    ▼
AppointmentsController.create()
    ▼
AppointmentsService.create()
    ├── Load patient profile (from req.user or body)
    ├── Validate doctor exists
    ├── Check doctor availability (dayOfWeek + time window)
    ├── Check doctor leave for that date
    ├── Check doctor double-booking (overlap query)
    ├── Check patient double-booking (overlap query)
    ├── prisma.appointment.create(...)
    └── NotificationsService.createAndQueue(APPOINTMENT_BOOKED)
              │
              ▼
        Bull Queue Job added to Redis
              │
              ▼  (async, non-blocking)
        EmailProcessor handles job
              │
              ▼
        Email sent to patient via SMTP
    ▼
201 Created { appointment }
```

### Password Reset Flow

```
User enters email → POST /auth/forgot-password
    ▼
AuthService
    ├── Find user by email
    ├── Generate crypto.randomBytes(32).toString('hex') token
    ├── Store in password_reset_tokens (expires 1hr)
    └── EmailService.sendMail(reset link with token)

User clicks email link → /reset-password?token=<TOKEN>
    ▼
POST /auth/reset-password { token, newPassword }
    ▼
AuthService
    ├── Find token in password_reset_tokens (not expired, not used)
    ├── Hash new password with bcryptjs
    ├── Update user.passwordHash
    ├── Mark token.used = true
    └── Return success
```

---

## API Request Lifecycle

```
HTTP Request arrives at NestJS
          │
          ▼
      Middleware          (e.g. logging, CORS)
          │
          ▼
   Exception Filter       (GlobalExceptionFilter wraps everything)
          │
          ▼
      Interceptors         (e.g. response transform)
          │
          ▼
       Guards              JwtAuthGuard → RolesGuard
          │
          ▼
       Pipes               ValidationPipe (DTO validation + transform)
          │
          ▼
     Controller            Route handler
          │
          ▼
      Service              Business logic
          │
          ▼
   PrismaService           Database query
          │
          ▼
  Response / Exception
          │
   Exception? ──────────► GlobalExceptionFilter normalizes to:
                           { statusCode, message, error, timestamp, path }
```

---

## Environment Configuration

### API Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `PORT` | No | `3001` | API listen port |
| `NODE_ENV` | No | `development` | Runtime environment |
| `FRONTEND_URL` | Yes | — | Used in password reset email links |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs (min 32 chars recommended) |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiry duration |
| `REDIS_HOST` | No | `localhost` | Redis hostname |
| `REDIS_PORT` | No | `6379` | Redis port |
| `SMTP_HOST` | Yes* | — | SMTP server hostname |
| `SMTP_PORT` | Yes* | — | SMTP server port |
| `SMTP_USER` | Yes* | — | SMTP login username |
| `SMTP_PASS` | Yes* | — | SMTP login password |
| `SMTP_FROM` | Yes* | — | Sender display address |

*Required for email functionality to work.

### Web Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Full API base URL visible to the browser (e.g. `http://<IP>:3001/api/v1`) |

> `NEXT_PUBLIC_*` variables are baked into the browser bundle at **build time**. If you change the API URL, you must rebuild the web Docker image.

---

## Security Considerations

| Area | Measure |
|---|---|
| Passwords | bcryptjs hash (10 rounds), never stored in plaintext |
| JWT | Short-lived tokens (7d default), secret via env var |
| Authorization | Per-endpoint role checks via guard + `@Roles()` |
| Input validation | `class-validator` DTOs on all write endpoints |
| SQL injection | Prisma ORM parameterized queries — no raw SQL |
| CORS | Configured in NestJS to restrict origins |
| Sensitive env | Never committed to source control (`.env` in `.gitignore`) |
| Password reset | Single-use tokens with 1-hour expiry |
| Docker | Web container runs as non-root `nextjs` user |
| Secrets in prod | Pass via environment variables or secrets manager, not hardcoded |
