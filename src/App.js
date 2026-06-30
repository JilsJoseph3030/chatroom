import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import ChatRooms from "./components/ChatRooms";
import ChatRoom from "./components/ChatRoom";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./components/ThemeContext";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/rooms" element={<ChatRooms />} />
          <Route path="/room/:id" element={<ChatRoom />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
