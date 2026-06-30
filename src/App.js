import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./components/Auth";
import ChatRooms from "./components/ChatRooms";
import ChatRoom from "./components/ChatRoom";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./components/ThemeContext";
import { ToastProvider } from "./components/Toast";
import "./App.css";

function AppContent() {
  // undefined = loading, null = no user, object = authenticated user
  const [user, setUser] = useState(undefined);
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return () => unsub();
  }, []);

  if (user === undefined) {
    return (
      <div className="app-loading">
        <div className="loading-spinner-large" />
      </div>
    );
  }

  const showNavbar = !!user && location.pathname !== "/";

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/"         element={user ? <Navigate to="/rooms" replace /> : <Auth />} />
        <Route path="/rooms"    element={user ? <ChatRooms /> : <Navigate to="/" replace />} />
        <Route path="/room/:id" element={user ? <ChatRoom />  : <Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
