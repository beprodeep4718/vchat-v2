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
    origin: "*", // Be more permissive during testing, restrict later
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Ensure all transport methods are available
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
  
  // Add handler for ICE candidates
  socket.on("ice-candidate", ({ to, candidate, from }) => {
    io.to(to).emit("ice-candidate", { candidate, from });
  });
  
  // Handle call ending
  socket.on("call:end", ({ to, from, name }) => {
    io.to(to).emit("callEnded", { from, name });
  });
  
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
