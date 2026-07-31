import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import workspaceRouter from "./workspace.js";
import { initializeSocket } from "./socket.js";
import fileRouter from "../routes/file.js";
import executeRouter from "../routes/execute.js";
import { hocuspocus } from "./hocuspocus.js";

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN || "*";

app.use(cors({ origin: clientOrigin }));

app.use(express.json());

app.use("/workspace", fileRouter);

app.use("/workspace", workspaceRouter);

app.use("/execute", executeRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Server Running",
  });
});

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// socket.io attaches its own upgrade handling on the /socket.io/ path.
initializeSocket(server);

// Hocuspocus shares the same server: every non-socket.io WebSocket upgrade is
// routed to it, so REST, presence, and Yjs sync all run on one port.
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  if (request.url && request.url.startsWith("/socket.io/")) return;

  wss.handleUpgrade(request, socket, head, (ws) => {
    // handleConnection only creates the connection; we must forward the
    // socket's message/close events into Hocuspocus ourselves.
    const connection = hocuspocus.handleConnection(ws, request);

    ws.on("message", (data) => {
      connection.handleMessage(new Uint8Array(data));
    });

    ws.on("close", (code, reason) => {
      connection.handleClose({ code, reason: reason?.toString() });
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
