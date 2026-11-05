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
| Backend | Node.js 18+, Express 4, Mongoose 8 (MongoDB with geospatial queries), Socket.IO 4, JWT, bcrypt, Multer + Cloudinary |
| Tests | `node:test` + `mongodb-memory-server` (end-to-end API tests) |

## Quick start (no database install needed)

```bash
npm install --prefix backend
npm install --prefix frontend

# Terminal 1: API on :5000 with an in-memory MongoDB and demo data
npm run dev:memory --prefix backend

# Terminal 2: web app on :5173
npm run dev --prefix frontend
```

Demo accounts (password `password123`): `admin@demo.local`, `responder@demo.local`, `citizen@demo.local`. The in-memory data is wiped when the API stops. The first run downloads a MongoDB binary (about 600 MB).

## Running with a real database

```bash
cp backend/.env.example backend/.env   # set MONGODB_URI and JWT_SECRET
npm run dev --prefix backend

# Create the first admin (sign-up only creates citizens)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=change-me npm run create-admin --prefix backend
```

The frontend reads `frontend/.env.development` in dev (points at `localhost:5000`) and `frontend/.env` for production builds.

## Environment variables

**Backend**

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB / Atlas connection string |
| `JWT_SECRET` | yes (production) | Long random string |
| `FRONTEND_URL` | no | Allowed CORS origins, comma separated (`*.vercel.app` is always allowed) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | for uploads in production | Without them, uploads go to `backend/uploads/` (disabled on Vercel) |
| `PUBLIC_URL` | no | Public API URL, used for links to locally stored uploads |

**Frontend** (build time)

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | e.g. `https://your-api.example.com/api` |
| `VITE_SOCKET_URL` | API origin for Socket.IO |
| `VITE_ENABLE_SOCKET` | Set to `false` when the API runs on a serverless host (Vercel) |

## Deployment

- **Frontend:** deploy `frontend/` to Vercel (framework: Vite). `vercel.json` handles SPA routing.
- **API, full real-time (recommended):** deploy `backend/` (`npm start`) to a persistent host such as Railway, Render or Fly.io.
- **API on Render (one click):** Render dashboard → New → Blueprint → select this repo. `render.yaml` creates the service from `backend/` and generates `JWT_SECRET`. Enter `MONGODB_URI` (a free MongoDB Atlas cluster works; allow access from `0.0.0.0/0`) and, optionally, the Cloudinary keys. The free plan sleeps when idle, so the first request after a while takes about 30 s.
- **API on Railway:** New Project → Deploy from GitHub repo, set Root Directory to `backend`, add `MONGODB_URI`, `JWT_SECRET` and `NODE_ENV=production`, then Settings → Networking → Generate Domain.
- **After the API is live:** set `VITE_API_URL=https://<api-host>/api` and `VITE_SOCKET_URL=https://<api-host>` on the Vercel frontend project and redeploy, then run `npm run create-admin` against the production database.
- **API on Vercel:** deploy `backend/` as its own Vercel project. `api/index.js` serves the REST API as a serverless function. Socket.IO and chat are not available there, so build the frontend with `VITE_ENABLE_SOCKET=false` (it polls instead). Set the `CLOUDINARY_*` variables for media uploads.

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
npm test --prefix backend     # 16 end-to-end API tests
npm run lint --prefix frontend
npm run build --prefix frontend
```
