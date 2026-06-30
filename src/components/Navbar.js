import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { useToast } from "./Toast";

function getInitials(user) {
  if (!user) return "?";
  if (user.displayName) {
    return user.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return user.email ? user.email[0].toUpperCase() : "?";
}

function getDisplayName(user) {
  if (!user) return "";
  return user.displayName || user.email?.split("@")[0] || "User";
}

export default function Navbar() {
  const navigate        = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast }       = useToast();
  const user            = auth.currentUser;

  const logout = async () => {
    await signOut(auth);
    toast("Signed out. See you soon! 👋", "info");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-logo-icon">💬</div>
        <h1 className="logo">ChatRoom</h1>
      </div>

      <div className="navbar-right">
        {user && (
          <div className="user-info">
            <div className="user-avatar" title={user.email}>
              {getInitials(user)}
            </div>
            <span className="user-name">{getDisplayName(user)}</span>
          </div>
        )}

        <button className="theme-btn" onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        <button className="logout-btn" onClick={logout}>
          ← Logout
        </button>
      </div>
    </nav>
  );
}
