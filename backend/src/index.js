import express from "express";
import cors from "cors";
import workspaceRouter from "./workspace.js";
import http from "http";
import { initializeSocket } from "./socket.js";
import fileRouter from "./routes/file.js";

app.use("/workspace", fileRouter);
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Server Running",
  });
});

app.use("/workspace", workspaceRouter);

const PORT = 3000;

const server = http.createServer(app);

initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});