# Smart Library Frontend

React + Vite frontend wired to Smart Library backend APIs.

## What This Frontend Does

- Auth: register and login
- Public catalog: book search and book detail availability
- Student circulation: issue, return, reserve
- Admin/Librarian: add books
- Admin: inventory load, add stock, transfer stock
- Role-aware UI based on JWT login response

## Environment Setup

Create a local env file in this folder:

1. Copy `.env.example` to `.env`
2. Keep or edit:

VITE_API_BASE_URL=http://localhost:5000/api/v1

Optional for non-standard host:

VITE_API_ORIGIN=http://localhost:5000

## Run Frontend

From the root project folder:

1. Install frontend packages (first time only)
npm --prefix frontend install

2. Start frontend
npm run frontend:dev

Open http://localhost:5173

## Backend Requirement

Backend must be running on port 5000.

Quick backend commands from root:

1. npm run prisma:push
2. npm run seed
3. npm start

## Testing Roles

Seeded credentials (password: password123):

- Admin: admin@smartlibrary.in
- Librarian: librarian@smartlibrary.in
- Student: rahul@smartlibrary.in

Use student account for circulation tests and admin account for management tests.
