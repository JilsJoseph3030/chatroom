import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useToast } from "./Toast";
import "../App.css";

import { useAdminMode } from "./AdminModeContext";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, isAdminMode } = useAdminMode();
  
  const [activeTab, setActiveTab] = useState("rooms"); // "rooms" or "users"
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editString, setEditString] = useState("");

  useEffect(() => {
    if (!isSuperAdmin || !isAdminMode) {
      navigate("/");
    }
  }, [isSuperAdmin, isAdminMode, navigate]);

  useEffect(() => {
    const qRooms = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsubRooms = onSnapshot(qRooms, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qUsers = query(collection(db, "users"), orderBy("lastLogin", "desc"));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubRooms();
      unsubUsers();
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "rooms" || !selectedRoom) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, "rooms", selectedRoom, "messages"),
      orderBy("createdAt")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedRoom, activeTab]);

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this entire room?")) return;
    try {
      await deleteDoc(doc(db, "rooms", roomId));
      if (selectedRoom === roomId) setSelectedRoom(null);
      toast("Room deleted.", "info");
    } catch {
      toast("Failed to delete room.", "error");
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteDoc(doc(db, "rooms", selectedRoom, "messages", msgId));
      toast("Message deleted.", "info");
    } catch {
      toast("Failed to delete.", "error");
    }
  };

  const handleEditMessage = async (msgId) => {
    if (!editString.trim()) return;
    try {
      await updateDoc(doc(db, "rooms", selectedRoom, "messages", msgId), {
        text: editString.trim()
      });
      setEditingMsgId(null);
      toast("Message updated.", "success");
    } catch {
      toast("Failed to update message.", "error");
    }
  };

  const startEdit = (msg) => {
    setEditingMsgId(msg.id);
    setEditString(msg.text);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <p>Manage all rooms and messages.</p>
      </div>

      <div className="admin-container">
        <div className="admin-sidebar">
          <div className="admin-tabs">
            <button 
              className={`admin-tab-btn ${activeTab === "rooms" ? "active" : ""}`}
              onClick={() => setActiveTab("rooms")}
            >Rooms</button>
            <button 
              className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >Users</button>
          </div>

          {activeTab === "rooms" && (
            <div className="admin-rooms-list">
              {rooms.map((r) => (
                <div 
                  key={r.id} 
                  className={`admin-room-item ${selectedRoom === r.id ? "active" : ""}`}
                  onClick={() => setSelectedRoom(r.id)}
                >
                  <span>{r.emoji} {r.name}</span>
                  <button 
                    className="admin-del-btn"
                    onClick={(e) => handleDeleteRoom(r.id, e)}
                    title="Delete Room"
                  >
                    🗑️
                  </button>
                </div>
              ))}
              {rooms.length === 0 && <p className="admin-empty">No rooms available.</p>}
            </div>
          )}

          {activeTab === "users" && (
            <div className="admin-users-sidebar">
              <p className="admin-info-text">Total Users: {users.length}</p>
            </div>
          )}
        </div>

        <div className="admin-main">
          {activeTab === "rooms" ? (
            selectedRoom ? (
              <>
                <h3>Messages in Room</h3>
                <div className="admin-messages-area">
                  {messages.length === 0 && <p className="admin-empty">No messages.</p>}
                  {messages.map((msg) => (
                    <div key={msg.id} className="admin-msg-row">
                      <div className="admin-msg-info">
                        <strong>{msg.displayName || msg.user?.split("@")[0]}</strong> 
                        <span className="admin-msg-email">({msg.user})</span>
                      </div>
                      {editingMsgId === msg.id ? (
                        <div className="admin-msg-edit">
                          <textarea 
                            value={editString} 
                            onChange={(e) => setEditString(e.target.value)}
                          />
                          <button onClick={() => handleEditMessage(msg.id)}>Save</button>
                          <button onClick={() => setEditingMsgId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div className="admin-msg-text">{msg.text}</div>
                      )}
                      <div className="admin-msg-actions">
                        <button onClick={() => startEdit(msg)}>Edit</button>
                        <button className="delete" onClick={() => handleDeleteMessage(msg.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="admin-empty-state">
                <p>Select a room to view and manage messages.</p>
              </div>
            )
          ) : (
            // Users tab
            <>
              <h3>Registered Users</h3>
              <div className="admin-users-area">
                {users.length === 0 && <p className="admin-empty">No users found in database.</p>}
                {users.map(u => (
                  <div key={u.id} className="admin-user-row">
                    <div className="admin-user-avatar">{u.email[0].toUpperCase()}</div>
                    <div className="admin-user-details">
                      <strong>{u.displayName || "Unknown"}</strong>
                      <span>{u.email}</span>
                      <span className="admin-user-meta">ID: {u.uid}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
