# CodeRoom

A real-time collaborative code editor. Multiple people open the same
workspace, edit the same files, and see each other's cursors, selections,
and changes live — powered by a hand-rolled CRDT sync layer, not a
drop-in library.

**Live demo:** https://code-room-xi.vercel.app

## What it does

- **Multi-file workspaces** — create a workspace, share the link, add/rename/delete files
- **Live collaborative editing** — every keystroke syncs to everyone in the workspace in real time
- **Colored cursors & live selections** — see exactly where everyone else is looking and selecting
- **Presence & typing indicators** — who's online, who's typing, who joined/left
- **Persistence** — content survives reloads and reconnects, backed by Postgres
- **Language auto-detection** — name a file `.py`, `.cpp`, `.js`, etc. and it just works, with a starter snippet if the file is empty
- **In-browser code execution** — run the code and see the output (via Judge0)

## Why this isn't just "another CRDT editor tutorial"

Most collaborative-editor projects wire up [`y-monaco`](https://github.com/yjs/y-monaco)
and call it done. This project deliberately does **not** use that library —
the Monaco ↔ Yjs binding ([`yjsBinding.ts`](frontend/cODE-ROOM/src/yjsBinding.ts))
is hand-written: it translates Monaco's edit events into Yjs `Y.Text` deltas
and applies remote Yjs deltas back into Monaco via `applyEdits` — not
`setValue`, which would reset every collaborator's cursor to line 1 on every
remote keystroke (a real bug this project hit and fixed).

Sync and persistence run through [Hocuspocus](https://tiptap.dev/hocuspocus)
(a Yjs backend), while presence, typing indicators, and file-tree events run
over a separate Socket.IO channel — both consolidated onto a single backend
port for deployment.

## Tech stack

**Frontend** — React, TypeScript, Vite, Monaco Editor, Yjs, `@hocuspocus/provider`, Socket.IO client

**Backend** — Node.js, Express, Socket.IO, `@hocuspocus/server`, Prisma, PostgreSQL

**Testing** — Vitest, covering CRDT convergence under concurrent edits and the
Monaco↔Yjs binding itself (against a faithful fake Monaco model), not just
trivial utility functions

## Architecture

```
Monaco Editor
     │  edit events / remote deltas (applyEdits, cursor-preserving)
     ▼
 Y.Text (per file, inside a per-workspace Y.Doc)
     │
     ▼
Hocuspocus Provider ──ws──▶ Hocuspocus Server ──▶ Postgres (persisted state)
                                    │
Socket.IO  ────────────────────────┘  (presence, typing, file-tree events —
                                        shares the same HTTP port)
```

Each **workspace gets its own `Y.Doc`**, owned by its Hocuspocus provider —
not a shared global doc — so switching workspaces in one tab can't leak one
workspace's content into another.

## Project structure

```
backend/
  src/
    index.js        # Express app + single-port Socket.IO/Hocuspocus wiring
    socket.js        # presence, typing, cursor/file-tree relay
    hocuspocus.js    # Yjs doc load/store hooks (Postgres persistence)
    prisma.js
  routes/
    file.js          # file CRUD REST endpoints
    execute.js        # proxies code execution to Judge0 (keeps API key server-side)
  prisma/schema.prisma

frontend/cODE-ROOM/
  src/
    yjsBinding.ts     # the hand-rolled Monaco <-> Y.Text bridge
    hocuspocus.ts     # per-workspace provider setup
    awarenessColor.ts # deterministic per-user cursor colors
    components/       # CodeEditor, FileExplorer, Output
    pages/            # Home, Workspace
    __tests__/        # CRDT + binding + utility tests
```

## Running locally

Requires Node 22+ and a Postgres database (e.g. a free [Supabase](https://supabase.com) project).

**Backend**
```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL (and RAPIDAPI_KEY if you want code execution)
npm install
npx prisma db push
npm run dev             # http://localhost:3000
```

**Frontend**
```bash
cd frontend/cODE-ROOM
cp .env.example .env    # optional locally; defaults to localhost:3000
npm install
npm run dev              # http://localhost:5173
```

**Tests**
```bash
cd frontend/cODE-ROOM
npm test
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) — backend on Render, frontend on Vercel,
database on Supabase. The backend runs Socket.IO and Hocuspocus on a single
HTTP port so it fits a standard one-port host.

## Known limitations

- Code execution requires your own free [Judge0/RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce) key
- No authentication — anyone with a workspace link can join and edit
- Render's free tier sleeps after ~15 minutes idle (expect a cold-start delay on the first request)
