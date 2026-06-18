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
    (user) => user.socketId !== socket.id
  );

workspaceUsers[workspaceId].push({
  socketId: socket.id,
  username,
});

        io.to(workspaceId).emit(
          "users-update",
          workspaceUsers[workspaceId]
        );

        console.log(
          `${username} joined ${workspaceId}`
        );
      }
    );

    socket.on("file-change", (data) => {
      socket
        .to(data.workspaceId)
        .emit("file-change", data);
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
      const workspaceId =
        socket.workspaceId;

      if (workspaceId) {
        workspaceUsers[workspaceId] =
          workspaceUsers[workspaceId].filter(
            (user) =>
              user.socketId !== socket.id
          );

          if (workspaceUsers[workspaceId].length === 0) {
  delete workspaceUsers[workspaceId];
}

        io.to(workspaceId).emit(
          "users-update",
          workspaceUsers[workspaceId]
        );
      }

      console.log(
        "Disconnected:",
        socket.id
      );
    });
  });
}