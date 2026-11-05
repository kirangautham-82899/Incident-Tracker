# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Use GitHub's
[private vulnerability reporting](https://github.com/kirangautham-82899/Incident-Tracker/security/advisories/new)
or email kirangautham82899@gmail.com. You'll get a reply within a few days.

## How the app is protected

- **Secrets** live only in Vercel environment variables and a git-ignored `backend/.env`; nothing secret is committed.
- **Database:** Supabase Postgres with Row Level Security on every table and no public policies, so the public Supabase API can't read or write data. Only the backend (server-side credentials) can.
- **Auth:** bcrypt (cost 12) password hashes; passwords need 8+ characters with a letter and a number; HS256 JWTs pinned to one algorithm, valid 7 days and revoked on password change or account deactivation; sign-up can never grant staff roles.
- **Abuse limits:** per-IP rate limits (stored in Postgres, so they hold across serverless instances) on login, sign-up, reports, comments, confirmations and uploads.
- **Uploads:** images/videos only, max 10 MB, sent straight to Supabase Storage with one-time signed URLs; reports may only reference files in the project's own storage.
- **HTTP:** strict Content-Security-Policy, HSTS, frame blocking and other headers on the site (`vercel.json`) and the API (helmet); CORS limited to this project's own origins.
- **Data exposure:** internal responder notes and reporter contact details are only returned to responders/admins.
- **Supply chain:** CI runs tests, lint, build and `npm audit`; CodeQL scans the code; Dependabot proposes dependency updates.
