import React from "react";
import { auth } from "../firebase";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { useToast } from "./Toast";
import { useAdminMode } from "./AdminModeContext";

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
  const { isAdminMode, isSuperAdmin, toggleAdminMode } = useAdminMode();

  const logout = async () => {
    await signOut(auth);
    toast("Signed out. See you soon! 👋", "info");
    navigate("/");
  };

  const handleChangeName = async () => {
    if (!user) return;
    const newName = window.prompt("Enter new display name:", getDisplayName(user));
    if (newName && newName.trim() !== "") {
      try {
        await updateProfile(user, { displayName: newName.trim() });
        // Also update Firestore users collection
        await updateDoc(doc(db, "users", user.uid), {
          displayName: newName.trim()
        });
        toast("Name updated successfully!", "success");
      } catch (err) {
        toast("Failed to update name.", "error");
      }
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-logo-icon">💬</div>
        <h1 className="logo">ChatRoom</h1>
      </div>

      <div className="navbar-right">
        {isSuperAdmin && (
          <button className={`theme-btn ${isAdminMode ? 'admin-active' : ''}`} onClick={toggleAdminMode} title="Toggle Admin Mode">
            🛡️ <span>{isAdminMode ? "Admin: ON" : "Admin: OFF"}</span>
          </button>
        )}

        {isSuperAdmin && isAdminMode && (
          <button className="theme-btn admin-link-btn" onClick={() => navigate("/admin")}>
            ⚙️ <span>Panel</span>
          </button>
        )}

        {user && (
          <div className="user-info" onClick={handleChangeName} style={{ cursor: "pointer" }} title="Click to change name">
            <div className="user-avatar" title={user.email}>
              {getInitials(user)}
            </div>
            <span className="user-name">{getDisplayName(user)}</span>
          </div>
        )}

        <button className="theme-btn" onClick={toggleTheme}>
          {theme === "light" ? "🌙" : "☀️"} <span>{theme === "light" ? "Dark" : "Light"}</span>
        </button>

        <button className="logout-btn" onClick={logout}>
          ← <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
