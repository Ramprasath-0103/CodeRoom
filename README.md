# CodeRoom

A real-time collaborative code editor. Create a workspace, share the link, and
everyone edits the same files together with live cursors, presence and
in-browser code execution.

**Live demo:** https://code-room-xi.vercel.app

## Features

- **Multi-file workspaces** — create, rename and delete files; changes appear for everyone instantly
- **Live collaborative editing** — concurrent edits merge automatically, even after going offline
- **Per-user undo** — `Ctrl/Cmd+Z` undoes only your own changes, never a teammate's
- **Cursors, selections and presence** — see who is here, which file they are in and who is typing
- **Connection status** — a badge shows when you are live, reconnecting or offline
- **Language detection** — the file extension picks syntax highlighting and a starter snippet
- **Run code** — C, C++, C#, Go, Java, JavaScript, PHP, Python, Ruby, Rust and TypeScript via Judge0

## Architecture

```
 Browser (React + Monaco)                      Backend (Node.js, one port)
┌─────────────────────────────┐               ┌──────────────────────────────────┐
│ Monaco editor               │               │ Express                          │
│   ⇅ textBinding.ts          │   REST        │   POST /api/workspaces           │
│ Y.Doc (one per workspace)   │ ───────────▶  │   GET  /api/workspaces/:id       │
│   files: Y.Map              │               │   POST /api/execute ──▶ Judge0   │
│ Awareness (presence)        │   WebSocket   │                                  │
│ HocuspocusProvider          │ ◀──────────▶  │ Hocuspocus at /collaboration     │
└─────────────────────────────┘               │   onConnect: workspace exists?   │
                                              │   onLoad / onStore ──▶ Postgres  │
                                              └──────────────────────────────────┘
```

Everything people share lives in **one Yjs document per workspace**:

```
Y.Doc
└── files: Y.Map<fileId, Y.Map>
        ├── name: string
        ├── createdAt: number
        └── content: Y.Text
```

Short-lived state such as names, colours, cursors, the open file and typing
status is shared through Yjs **awareness**, which is never saved.

In three sentences: all shared state sits in one Yjs document per workspace, so
concurrent changes merge without conflicts. Hocuspocus syncs that document over
a single WebSocket and saves it to Postgres as bytes. Express only creates
workspaces and forwards code to Judge0.

## Design decisions

| Decision | Why |
| --- | --- |
| CRDT (Yjs) instead of operational transforms | Edits merge correctly with no central ordering, and offline edits sync on reconnect |
| File tree inside the Y.Doc, not a separate table plus socket events | One source of truth, so creates, renames and deletes get the same sync, persistence and reconnect handling as text |
| Files as nested `Y.Map` entries, not top-level `Y.Text`s | Nested types can be deleted; deleting a file really removes its content |
| Awareness for presence, cursors and typing | Built into the Yjs protocol and cleaned up automatically when a client disconnects |
| Cursor positions stored as Yjs relative positions | Remote cursors stay on the right character while others type above them |
| `Y.UndoManager` with a local origin | Undo only reverts your own edits |
| Single HTTP port for REST and WebSocket | Free hosts such as Render expose one port |
| Single backend instance | Simple to run and explain; scaling out would need the Hocuspocus Redis extension |

## Project structure

```
backend/
  prisma/schema.prisma           Workspace table (id, yjsState, timestamps)
  scripts/
    migrateLegacyWorkspaces.js   One-off upgrade from the old File-table format
  src/
    server.js                    HTTP server, WebSocket wiring, graceful shutdown
    app.js                       Express app and middleware
    config/                      Environment variables and allowed origins
    database/                    Prisma client
    errors/                      HttpError
    middleware/                  Error handler, 404 handler, rate limiter
    workspaces/                  Routes → service → repository, workspace ids
    execution/                   Run-code routes, Judge0 client, language ids
    collaboration/               Hocuspocus server, upgrade handler, document helpers
  tests/                         Vitest + Supertest, including a live two-client sync test

frontend/
  src/
    api/                         Fetch wrapper and REST calls
    collaboration/               Yjs document helpers, Monaco binding, cursors, presence
    hooks/                       Connection, files, presence and display-name hooks
    components/                  Editor, file explorer, output, presence, activity
    pages/                       Home, workspace route and workspace page
    styles/                      Global styles and remote cursor colours
    utils/                       Languages, colours, storage, ids
    __tests__/                   Document, binding, presence and utility tests
```

## Running locally

Requires Node 22+ and Postgres. The quickest way to get Postgres is Docker:

```bash
docker compose up -d
```

**Backend**

```bash
cd backend
cp .env.example .env
npm install
npm run db:push
npm run dev
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `CLIENT_ORIGIN` | Comma-separated frontend origins allowed for REST and WebSocket; empty allows all |
| `RAPIDAPI_KEY` | Judge0 CE key from RapidAPI; without it, Run Code explains that execution is not configured |
| `PORT` | Defaults to 3000 |

**Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

`VITE_API_URL` points at the backend; the WebSocket URL is derived from it.

## Quality checks

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test && npm run build
```

GitHub Actions runs the same checks on every push and pull request.

## Known limitations

- No accounts: anyone with a workspace link can join and edit
- Run Code executes only the active file and needs your own Judge0 key
- One backend instance holds open documents in memory
- Render's free tier sleeps after about 15 minutes idle, so the first request is slow
