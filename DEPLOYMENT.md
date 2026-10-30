# Deployment Guide

CodeRoom deploys as three pieces:

- **Backend** (Express + Hocuspocus on one port) → **Render**
- **Frontend** (Vite + React) → **Vercel**
- **Database** → **Supabase** Postgres

Deploy the backend first: the frontend needs its URL, and the backend needs the
frontend's URL for its allowed origins.

## 1. Backend on Render

1. **New → Web Service**, connect the repository.
2. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install` (runs `prisma generate`)
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
3. Environment variables:

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | Supabase pooler connection string |
   | `RAPIDAPI_KEY` | Judge0 key, optional |
   | `CLIENT_ORIGIN` | Your Vercel URL, set after step 2 |

4. Apply the schema from your machine against the production database:

   ```bash
   cd backend
   DATABASE_URL="<production url>" npm run db:push
   ```

5. Deploy, then open `https://<your-service>.onrender.com/health`; it should return `{"status":"ok"}`.

On redeploy Render sends `SIGTERM`; the server saves every open document before exiting.

## 2. Frontend on Vercel

1. **Add New → Project**, import the repository.
2. **Root Directory**: `frontend` (it was `frontend/cODE-ROOM` before the restructure — update it in an existing project).
3. Environment variable `VITE_API_URL` = your Render URL.
4. Deploy. `vercel.json` rewrites every path to `index.html`, so refreshing `/workspace/:id` works.

## 3. Wire them together

1. Set `CLIENT_ORIGIN` on Render to the Vercel URL and redeploy. It restricts both
   REST calls and WebSocket connections to your frontend.
2. If `VITE_API_URL` changed after the first Vercel build, redeploy the frontend:
   Vite bakes environment variables in at build time.

## Upgrading a database created by the old version

Older versions stored the file list in a `File` table and file contents as
top-level texts in `Workspace.yjsState`. To keep existing workspaces:

1. Suspend the Render service so nobody writes in the old format during the upgrade.
2. Convert workspaces to the new document format:

   ```bash
   cd backend
   DATABASE_URL="<production url>" npm run db:migrate-legacy
   ```

   The script is safe to run twice; already converted workspaces are skipped.
3. Update the schema, which drops the `File` table and adds `updatedAt`:

   ```bash
   DATABASE_URL="<production url>" npx prisma db push --accept-data-loss
   ```

4. Deploy the new backend and frontend, then resume the service.

## Verify

Open the Vercel URL in two browser windows on the same `/workspace/:id`:

- Typing in one appears in the other
- Coloured cursors and selections follow each person
- Creating, renaming and deleting files updates both windows
- Stopping the backend shows **Offline**; edits made meanwhile sync after it returns
