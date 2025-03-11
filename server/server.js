require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const server = http.createServer(app);

app.use(cors());

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
