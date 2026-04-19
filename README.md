# Smart Distributed Library Management System API

Production-minded REST API for a distributed-ready library system, built as a modular monolith for fast execution and clean architecture.

## Tech Stack

- Node.js 20+
- Express.js
- Prisma ORM
- PostgreSQL
- Redis (ioredis)
- JWT auth (jsonwebtoken + bcryptjs)
- Validation with Zod
- Swagger docs (swagger-jsdoc + swagger-ui-express)

## Architecture

The codebase follows a modular monolith structure:

- `auth`
- `books`
- `branches`
- `inventory`
- `transactions`
- `reservations`
- `recommendations`
- `users`
- shared middleware/config/utils

## Key Capabilities

- JWT authentication and role-based authorization
- Row-level locking (`SELECT ... FOR UPDATE`) for safe concurrent issuing and stock transfer
- Reservation queue auto-fulfillment on book return
- Overdue fine calculation (configurable via env)
- Redis caching for book search
- Audit logging for all write endpoints
- Swagger API docs at `/api-docs`

## Setup (Local)

1. Install dependencies:

```bash
npm ci
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Push schema to DB:

```bash
npm run prisma:push
```

4. Seed sample data:

```bash
npm run seed
```

5. Start server:

```bash
npm run start
```

Server: `http://localhost:5000`
Swagger: `http://localhost:5000/api-docs`
Health: `http://localhost:5000/health`

## Frontend Setup (React + Vite)

The project now includes a frontend app under `frontend/` that is wired to the backend APIs.

1. Install frontend dependencies:

```bash
npm --prefix frontend install
```

2. Configure frontend environment:

```bash
cp frontend/.env.example frontend/.env
```

3. Start frontend dev server:

```bash
npm run frontend:dev
```

Frontend: `http://localhost:5173`

Helpful root scripts:

- `npm run frontend:dev`
- `npm run frontend:build`
- `npm run frontend:preview`

## Setup (Docker)

```bash
docker compose up --build
```

Then seed data from backend container:

```bash
docker compose exec backend npm run seed
```

## Demo Credentials

All seeded users use password: `password123`

- ADMIN: `admin@smartlibrary.in`
- LIBRARIAN: `librarian@smartlibrary.in`
- STUDENT: `rahul@smartlibrary.in`
- STUDENT: `priya@smartlibrary.in`

## Environment Variables

See `.env.example`.

Required keys:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `PORT`
- `FINE_PER_DAY`
- `LOAN_PERIOD_DAYS`

## API Overview

Base URL: `/api/v1`

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Books

- `GET /books`
- `POST /books`
- `GET /books/:id`
- `GET /books/:id/availability`

### Branches

- `GET /branches`
- `POST /branches`

### Inventory

- `GET /inventory`
- `POST /inventory`
- `PATCH /inventory/transfer`

### Transactions

- `POST /transactions/issue`
- `POST /transactions/return`
- `GET /transactions`
- `GET /transactions/my`

### Reservations

- `POST /reservations`
- `DELETE /reservations/:id`
- `GET /reservations/my`

### Recommendations

- `GET /recommendations/:userId`

### Users

- `GET /users`
- `GET /users/:id`

## Concurrency and Consistency Notes

- Issue flow locks user row and inventory row in a single transaction.
- Return flow locks transaction row and reservation queue row with `FOR UPDATE SKIP LOCKED`.
- Inventory transfer locks rows in deterministic branch order to reduce deadlock risk.

## Professional Notes

- Public registration is limited to student accounts to avoid role escalation.
- Keep admin and librarian creation behind seed/admin workflows.
- In production, rotate `JWT_SECRET` and restrict CORS origin.
