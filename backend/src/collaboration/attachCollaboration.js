import { WebSocketServer } from "ws";
import { isOriginAllowed } from "../config/cors.js";
import { collaborationServer } from "./collaborationServer.js";

export const COLLABORATION_PATH = "/collaboration";

const MAX_MESSAGE_BYTES = 5 * 1024 * 1024;

function rejectUpgrade(socket, statusCode, reason) {
  socket.write(`HTTP/1.1 ${statusCode} ${reason}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function getPathname(request) {
  return new URL(request.url ?? "/", "http://localhost").pathname;
}

function connectToCollaborationServer(webSocket, request) {
  const connection = collaborationServer.handleConnection(webSocket, request);

  webSocket.on("message", (data) => {
    connection.handleMessage(new Uint8Array(data));
  });

  webSocket.on("close", (code, reason) => {
    connection.handleClose({ code, reason: reason.toString() });
  });

  webSocket.on("error", (error) => {
    console.error("Collaboration socket error:", error);
  });
}

export function attachCollaboration(httpServer) {
  const webSocketServer = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });

  httpServer.on("upgrade", (request, socket, head) => {
    if (getPathname(request) !== COLLABORATION_PATH) {
      rejectUpgrade(socket, 404, "Not Found");
      return;
    }

    if (!isOriginAllowed(request.headers.origin)) {
      rejectUpgrade(socket, 403, "Forbidden");
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      connectToCollaborationServer(webSocket, request);
    });
  });

  return webSocketServer;
}
