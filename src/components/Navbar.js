import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();  // now defined

  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <h1 className="logo">💬 ChatRoom</h1>
      <div className="nav-actions">
        <button onClick={toggleTheme} className="theme-btn">
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
