import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Meet from "./pages/Meet";
import Notfound from "./pages/Notfound";
import { io } from "socket.io-client";

const socket = io(`${import.meta.env.VITE_SERVER_URL}`, { autoConnect: false });

const App = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" exact element={<Home socket={socket} />} />
          <Route path="/meet/:id" exact element={<Meet socket={socket} />} />
          <Route path="*" element={<Notfound />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
