import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __dirname = path.resolve();

// ✅ Fix: Use __dirname for static files in ESM
app.use(express.static(path.join(__dirname, "/client/dist")));
app.get("*", (_, res) => {
  res.sendFile(path.resolve(__dirname, "client", "dist", "index.html"));
});

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL, // Adjust this based on your frontend URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  socket.on("initiateCall", ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit("incommingCall", {
      signal: signalData,
      from: from,
      name: name,
    });
  });
  socket.on("acceptCall", ({ signalData, to, name }) => {
    io.to(to).emit("callAccepted", {
      signal: signalData,
      name: name,
    });
  });
  socket.on("callDeclined", ({ to }) => {
    io.to(to).emit("callDeclined");
  });
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
