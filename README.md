# Incident Tracker: Real-Time Incident Reporting Platform

Citizens report emergencies (fire, medical, accidents, infrastructure, safety) with location and photos. The community confirms reports, and responders triage, assign and resolve them from a prioritised console. Everyone sees updates live on a feed, a map and an analytics dashboard.

## Features

**Citizens**
- Report incidents (logged in or anonymously) with type, severity, GPS or map-picked location, address, photos and videos, and voice input
- Smart analysis of the description suggests the type and severity
- Duplicate warning when a similar open incident was reported within 500 m in the last 2 hours
- Confirm other people's reports; 3 independent confirmations auto-verify an incident
- Comment on incidents (live), share links, download a PDF
- "Am I safe?" check of open incidents within 2 km; SOS button that files a critical report at your GPS location
- Profile with reputation, badges, your reports and account settings

**Responders and admins** (`/admin`)
- Priority-sorted dispatch queue (type + severity + confirmations + age)
- Queues: open, unassigned, assigned to me, needs verification, closed
- Assign responders (with live workload), change status and severity, internal staff-only notes, status timeline
- Analytics: volume trends, type/status/severity breakdown, average response and resolution time
- Admins: manage users (promote to responder/admin, deactivate) and delete incidents

**System**
- Socket.IO live updates for incidents, comments and the community chat (with a built-in FAQ assistant)
- Falls back to polling every 20 s when no live connection is available
- JWT auth with role-based access; public sign-up always creates citizens
- Installable PWA

## Tech stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite 7, React Router 7, Zustand, Tailwind CSS 3, Leaflet (clusters and heat map), Recharts, Socket.IO client, jsPDF |
| Backend | Node.js 18+, Express 4, Socket.IO 4, JWT, bcrypt, Multer |
| Database | **Supabase Postgres** via `pg` (schema in `backend/db/schema.sql`, distance queries in SQL, no PostGIS needed) |
| File storage | **Supabase Storage** (public `incident-media` bucket, created automatically) |
| Tests | `node:test` + `embedded-postgres` (end-to-end API tests on a real Postgres) |

## Quick start (no database install needed)

```bash
npm install --prefix backend
npm install --prefix frontend

# Terminal 1: API on :5000 with a throwaway local Postgres and demo data
npm run dev:local --prefix backend

# Terminal 2: web app on :5173
npm run dev --prefix frontend
```

Demo accounts (password `password123`): `admin@demo.local`, `responder@demo.local`, `citizen@demo.local`. The local database is wiped when the API stops.

## Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com) (the free tier is enough).
2. **Database URL:** click **Connect** at the top of the project. Copy the **Session pooler** URI (port 5432) and put your database password in it. For a Vercel-hosted API, use the **Transaction pooler** URI (port 6543) instead.
3. **Storage keys:** go to Project Settings → API and copy the **Project URL** and the **service_role** key. This key is secret: only put it in the backend's environment, never in the frontend.
4. Run locally against Supabase:

```bash
cp backend/.env.example backend/.env   # fill DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm run dev --prefix backend           # creates the tables on first start

# Create the first admin (sign-up only creates citizens)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=change-me npm run create-admin --prefix backend
```

The tables are created automatically on startup (`npm run db:migrate --prefix backend` does the same by hand, or paste `backend/db/schema.sql` into the Supabase SQL editor). Row Level Security is enabled on every table with no policies, so Supabase's public REST API (anon key) cannot read or write them; all access goes through this backend.

The frontend reads `frontend/.env.development` in dev (points at `localhost:5000`); production values come from Vercel environment variables.

## Environment variables

**Backend**

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Supabase Postgres connection string (pooler) |
| `JWT_SECRET` | yes (production) | Long random string |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | for uploads in production | Supabase Storage. Without them, uploads go to `backend/uploads/` (disabled on Vercel) |
| `SUPABASE_STORAGE_BUCKET` | no | Defaults to `incident-media` |
| `DB_POOL_SIZE` | no | Default 10; use 1 on serverless |
| `DB_AUTO_MIGRATE` | no | `false` to skip applying the schema on startup |
| `FRONTEND_URL` | no | Allowed CORS origins, comma separated (`*.vercel.app` is always allowed) |
| `PUBLIC_URL` | no | Public API URL, used for links to locally stored uploads |

**Frontend** (build time)

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | e.g. `https://your-api.example.com/api` |
| `VITE_SOCKET_URL` | API origin for Socket.IO |
| `VITE_ENABLE_SOCKET` | Set to `false` when the API runs on a serverless host (Vercel) |

## Deployment

- **Frontend:** deployed on Vercel from `frontend/` (framework: Vite). `vercel.json` handles SPA routing.
- **API on Render (recommended, keeps real-time):** Render dashboard → New → Blueprint → select this repo. `render.yaml` creates the service from `backend/` and generates `JWT_SECRET`; enter `DATABASE_URL`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The free plan sleeps when idle, so the first request after a while takes about 30 s.
- **API on Railway:** New Project → Deploy from GitHub repo, set Root Directory to `backend`, add the same variables plus `NODE_ENV=production`, then Settings → Networking → Generate Domain.
- **API on Vercel:** deploy `backend/` as its own Vercel project. `api/index.js` serves the REST API as a serverless function (use the transaction pooler URL and `DB_POOL_SIZE=1`). Socket.IO and chat are not available there, so build the frontend with `VITE_ENABLE_SOCKET=false` (it polls instead).
- **After the API is live:** set `VITE_API_URL=https://<api-host>/api` and `VITE_SOCKET_URL=https://<api-host>` on the Vercel frontend project and redeploy, then run `npm run create-admin` with `DATABASE_URL` pointing at Supabase.

## API overview

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET/PUT | `/api/auth/me` | user |
| GET | `/api/incidents?type&status(open)&severity&search&mine&assigned=me&sort&page&limit` | public |
| GET | `/api/incidents/nearby?longitude&latitude&maxDistance` | public |
| POST | `/api/incidents` | public (anonymous allowed) |
| GET | `/api/incidents/:id` | public (notes for staff only) |
| PUT | `/api/incidents/:id` (status, severity, assignedTo) | responder/admin |
| POST | `/api/incidents/:id/verify` | user |
| POST | `/api/incidents/:id/notes` | responder/admin |
| DELETE | `/api/incidents/:id` | admin |
| GET/POST | `/api/incidents/:id/comments` | public / user |
| DELETE | `/api/comments/:id` | owner or admin |
| GET | `/api/analytics/stats`, `/trends?days`, `/heatmap` | public |
| GET | `/api/users/responders` | responder/admin |
| GET/PUT | `/api/users`, `/api/users/:id` | admin |
| POST | `/api/uploads` (multipart `files`) | public |

Socket events: `incident_created`, `incident_updated`, `incident_verified`, `incident_deleted`, `comment_added`, `comment_deleted` (room `incident_<id>`), `chat_message`, `chat_history`.

## Tests

```bash
npm test --prefix backend     # 21 end-to-end API tests on a real (embedded) Postgres
npm run lint --prefix frontend
npm run build --prefix frontend
```
