import { Server } from "socket.io";

const workspaceUsers = {};

export function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    // Typing
    socket.on(
      "typing",
      ({ workspaceId, username, fileId }) => {
        socket.to(workspaceId).emit(
          "typing",
          {
            username,
            fileId,
          }
        );
      }
    );

    socket.on(
      "stop-typing",
      ({ workspaceId }) => {
        socket
          .to(workspaceId)
          .emit("stop-typing");
      }
    );

    // Cursor Sharing
    socket.on(
      "cursor-move",
      ({
        workspaceId,
        username,
        fileId,
        position,
      }) => {
        socket.to(workspaceId).emit(
          "cursor-move",
          {
            username,
            fileId,
            position,
          }
        );
      }
    );

    // Join Workspace
    socket.on(
      "join-workspace",
      ({ workspaceId, username }) => {
        socket.join(workspaceId);

        socket.workspaceId = workspaceId;
        socket.username = username;

        if (!workspaceUsers[workspaceId]) {
          workspaceUsers[workspaceId] = [];
        }

        workspaceUsers[workspaceId] =
          workspaceUsers[workspaceId].filter(
            (user) =>
              user.socketId !== socket.id
          );

        workspaceUsers[workspaceId].push({
          socketId: socket.id,
          username,
        });

        io.to(workspaceId).emit(
          "users-update",
          workspaceUsers[workspaceId]
        );

        socket.to(workspaceId).emit(
          "user-joined",
          username
        );

        console.log(
          `${username} joined ${workspaceId}`
        );
      }
    );

    // File Content Sync
    socket.on("file-change", (data) => {
      socket
        .to(data.workspaceId)
        .emit("file-change", data);
    });

    // File Explorer Sync
    socket.on("create-file", (data) => {
      socket
        .to(data.workspaceId)
        .emit("create-file", data);
    });

    socket.on("rename-file", (data) => {
      socket
        .to(data.workspaceId)
        .emit("rename-file", data);
    });

    socket.on("delete-file", (data) => {
      socket
        .to(data.workspaceId)
        .emit("delete-file", data);
    });

    // Test Messages
    socket.on(
      "message",
      ({ workspaceId, message }) => {
        io.to(workspaceId).emit(
          "message",
          message
        );
      }
    );

    // Disconnect
    socket.on("disconnect", () => {
      const workspaceId =
        socket.workspaceId;

      const username =
        socket.username;

      if (workspaceId) {
        workspaceUsers[workspaceId] =
          workspaceUsers[workspaceId].filter(
            (user) =>
              user.socketId !== socket.id
          );

        if (
          workspaceUsers[workspaceId]
            .length === 0
        ) {
          delete workspaceUsers[
            workspaceId
          ];
        } else {
          io.to(workspaceId).emit(
            "users-update",
            workspaceUsers[workspaceId]
          );
        }

        socket.to(workspaceId).emit(
          "user-left",
          username
        );
      }

      console.log(
        "Disconnected:",
        socket.id
      );
    });
  });
}