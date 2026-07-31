# Deployment Guide

CodeRoom deploys as **two pieces**:

- **Backend** (Express + socket.io + Hocuspocus, all on one port) → **Render**
- **Frontend** (Vite/React) → **Vercel**
- **Database** → your existing **Supabase** Postgres (already set up)

The backend runs everything on a single port, so it fits Render's one-port web
service. The frontend talks to it through a single env var (`VITE_API_URL`); the
Yjs websocket URL is derived from it automatically.

> Deploy the **backend first** — you need its URL to configure the frontend, and
> the frontend's URL to lock down the backend's CORS. See "Wire them together".

---

## 1. Backend → Render

1. Push this repo to GitHub (if not already).
2. On [render.com](https://render.com): **New → Web Service**, connect the repo.
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`  (this runs `prisma generate` via postinstall)
   - **Start Command**: `npm start`
   - **Instance Type**: Free is fine for a demo (note: it sleeps after ~15 min
     idle and cold-starts in ~30–60s).
4. **Environment variables**:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | your Supabase pooler connection string (same as local `.env`) |
   | `RAPIDAPI_KEY` | your Judge0 key (optional — only for "Run Code") |
   | `CLIENT_ORIGIN` | set **after** the frontend is deployed (step 3) |
5. Deploy. Once live, note the URL, e.g. `https://coderoom-api.onrender.com`.
   Visiting it should show `{"message":"Server Running"}`.

Node is pinned to 22 via `backend/.node-version` (Hocuspocus requires it).

## 2. Frontend → Vercel

1. On [vercel.com](https://vercel.com): **Add New → Project**, import the repo.
2. Settings:
   - **Root Directory**: `frontend/cODE-ROOM`
   - Framework preset: **Vite** (auto-detected). Build/output defaults are correct.
3. **Environment variable**:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | your Render backend URL, e.g. `https://coderoom-api.onrender.com` |
4. Deploy. Note the URL, e.g. `https://coderoom.vercel.app`.

`vercel.json` already handles SPA routing so refreshing `/workspace/:id` works.

## 3. Wire them together

1. Back in **Render**, set `CLIENT_ORIGIN` to your Vercel URL
   (e.g. `https://coderoom.vercel.app`) and redeploy. This restricts CORS to
   your frontend.
2. If you set `VITE_API_URL` after the first Vercel build, **redeploy** the
   frontend so the value is baked into the bundle (Vite inlines env vars at
   build time).

## Verify

Open the Vercel URL in two browser tabs on the same `/workspace/:id`:
- Typing in one appears in the other (Yjs sync).
- Coloured cursors/selections track between tabs (awareness).
- The online-users list and typing indicator update (socket.io).

## Notes

- **Schema changes**: the schema is already applied to Supabase. If you change
  `schema.prisma`, run `npx prisma db push` locally against the prod database.
- **Cold starts**: on Render Free the first request after idle takes ~a minute.
  For a live demo, hit the backend URL once to wake it before presenting.
