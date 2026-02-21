# Deployment Guide

This project has **two independent deployment systems** — a static frontend and a serverless backend API. They are deployed separately.

---

## Architecture Overview

| | Frontend | Backend API |
|---|---|---|
| **Stack** | Astro (static site) | SST + AWS Lambda |
| **Hosting** | GitHub Pages | AWS API Gateway + Lambda |
| **Deploy trigger** | GitHub Actions | Manual (`pnpm run sst:deploy`) |
| **URL** | `ctrimm.github.io/co2-emission-tracker` | API Gateway endpoint (set via `PUBLIC_API_URL` secret) |
| **Data source** | Calls the backend API | Supabase database |

---

## Frontend — GitHub Pages

The Astro site is compiled to static HTML/CSS/JS and deployed to GitHub Pages.

### How it deploys

The `deploy.yml` workflow runs on three triggers:

1. **Push to `main`** — any merge or direct commit automatically redeploys
2. **Manual trigger** — via the GitHub Actions UI or CLI:
   ```bash
   gh workflow run deploy.yml --repo ctrimm/co2-emission-tracker
   ```
3. **After the nightly cron** — the CO2 emissions check runs at 5 AM UTC; if it succeeds, a deploy is triggered automatically to pick up fresh data

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (used by cron script) |
| `PUBLIC_API_URL` | The deployed AWS API Gateway URL |

### Build details

- Node version: **20**
- Package manager: **pnpm 9**
- Build command: `pnpm run build` (sets `NODE_OPTIONS=--max-old-space-size=8192` for large builds)
- Output directory: `./dist`

---

## Backend API — SST (AWS)

The backend is a set of AWS Lambda functions exposed via API Gateway, managed by [SST](https://sst.dev). This is **deployed separately from the frontend** and only needs to be redeployed when backend logic changes.

### API Routes

| Method | Path | Handler |
|---|---|---|
| `GET` | `/emissions-unique` | Latest unique emissions per domain |
| `GET` | `/emissions/{domain}` | Emissions history for a specific domain |
| `GET` | `/sites` | List of monitored sites |
| `GET` | `/stats` | Aggregate statistics |
| `GET` | `/trend` | Emissions trend data |
| `GET` | `/leaderboard` | Leaderboard rankings |

CORS is restricted to `https://co2.ignitebright.com` and `http://localhost:4321`.

### Deploying the backend

Prerequisites: AWS credentials configured locally.

```bash
# Deploy to production
pnpm run sst:deploy --stage production

# Deploy to a personal dev stage
pnpm run sst:deploy --stage <your-name>

# Local development (runs Lambda handlers locally)
pnpm run sst:dev
```

### Required environment variables for SST

| Variable | Description |
|---|---|
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public API key |

These are stored as SST secrets (`MySupabaseUrl`, `MySupabaseAnonRoleKey`) and injected into the Lambda environment automatically.

### Removal policy

- **Production stage** — resources are **retained** on `sst remove` (safe)
- **Other stages** — resources are **deleted** on `sst remove`

---

## Nightly Cron Job

The `co2-emissions-cron.yml` workflow runs daily at **5 AM UTC**. It:

1. Runs `scripts/co2-emissions-check.js` to measure CO2 emissions for tracked sites
2. Writes results to Supabase
3. On success, automatically triggers a frontend redeploy so the site reflects fresh data

---

## Local Development

```bash
# Install dependencies
pnpm install

# Run the Astro frontend
pnpm run dev

# Run SST backend locally (requires AWS credentials)
pnpm run sst:dev
```
