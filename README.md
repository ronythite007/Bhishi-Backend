# API Service (Next.js + Prisma)

Backend API service for Chitti Bhishi with:

- Next.js route handlers for API endpoints
- Prisma for schema and migrations
- Prisma for runtime database operations in API layer

## Scripts

- `npm run dev --workspace backend` - Start Next.js API server on port 4000
- `npm run build --workspace backend` - Build the Next.js API app
- `npm run start --workspace backend` - Start built Next.js server on port 4000
- `npm run prisma:migrate:dev --workspace backend` - Create/apply migrations in development
- `npm run prisma:migrate:deploy --workspace backend` - Apply committed migrations
- `npm run prisma:generate --workspace backend` - Generate Prisma client

## Endpoints

- `GET /api/health`
- `GET /api/funds`
- `POST /api/funds`

## Project Layout

- `app/api/health/route.ts` - Health endpoint
- `app/api/funds/route.ts` - Funds endpoints
- `lib/fundsRepository.ts` - Prisma DB operations for funds
- `lib/prisma.ts` - Prisma/Postgres connection
- `../database/prisma/schema.prisma` - Prisma schema
- `../database/prisma/migrations/*/migration.sql` - SQL migrations

## Environment Variables

Create `backend/.env` from `.env.example` and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require"
FRONTEND_ORIGIN="http://localhost:5173,http://localhost:5174"
```
