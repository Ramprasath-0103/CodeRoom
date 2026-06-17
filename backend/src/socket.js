import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("join-workspace", (workspaceId) => {
      socket.join(workspaceId);

      console.log(
        `Socket ${socket.id} joined ${workspaceId}`
      );
    });

    socket.on(
      "message",
      ({ workspaceId, message }) => {
        io.to(workspaceId).emit(
          "message",
          message
        );
      }
    );

    socket.on("disconnect", () => {
      console.log(
        "Disconnected:",
        socket.id
      );
    });
  });
}