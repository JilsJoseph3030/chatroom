import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { useToast } from "./Toast";

const ROOM_EMOJIS = [
  "💬","🎮","🎵","📚","🔥","💡","🌍","🚀","🎨","⚽",
  "🍕","💻","🐱","🎭","🏆","🤖","🎯","🌈","💎","🦋",
  "🎪","🏖️","🎲","🧠","🎸","📸","🌙","⭐","🦄","🍀",
];

export default function ChatRooms() {
  const [rooms,         setRooms]         = useState([]);
  const [roomName,      setRoomName]      = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("💬");
  const [search,        setSearch]        = useState("");
  const [showModal,     setShowModal]     = useState(false);
  const [loading,       setLoading]       = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const createRoom = async () => {
    const trimmed = roomName.trim();
    if (!trimmed) { toast("Please enter a room name.", "error"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "rooms"), {
        name:      trimmed,
        emoji:     selectedEmoji,
        createdBy: auth.currentUser.displayName || auth.currentUser.email,
        createdAt: serverTimestamp(),
      });
      setRoomName(""); setSelectedEmoji("💬"); setShowModal(false);
      toast(`Room "${trimmed}" created! 🎉`, "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const user        = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "there";
  const filtered    = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rooms-page">
      {/* Header */}
      <div className="rooms-header">
        <div className="rooms-title-group">
          <h2 className="rooms-title">Chat Rooms</h2>
          <p className="rooms-subtitle">Hey {displayName}! Pick a room or create your own. 👋</p>
        </div>
        <button className="create-room-btn" onClick={() => setShowModal(true)}>
          + New Room
        </button>
      </div>

      {/* Search */}
      <div className="rooms-search-bar">
        <span className="search-icon">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rooms…"
        />
      </div>

      {/* Room Grid */}
      <div className="rooms-grid">
        {filtered.length === 0 ? (
          <div className="rooms-empty">
            <span className="rooms-empty-icon">{search ? "🔍" : "💬"}</span>
            <h3>{search ? "No rooms found" : "No rooms yet"}</h3>
            <p>{search ? "Try a different search term." : "Be the first — create a room!"}</p>
          </div>
        ) : (
          filtered.map((room) => (
            <Link key={room.id} to={`/room/${room.id}`} className="room-card">
              <div className="room-card-top">
                <div className="room-emoji">{room.emoji || "💬"}</div>
                <div className="room-card-info">
                  <h3 className="room-card-name">{room.name}</h3>
                  <p className="room-card-creator">by {room.createdBy || "Unknown"}</p>
                </div>
              </div>
              <div className="room-card-footer">
                <span className="room-join-label">Join room</span>
                <div className="room-join-arrow">→</div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* ── Create Room Modal ── */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Create a Room</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            {/* Emoji picker */}
            <div className="modal-form-group">
              <label className="modal-form-label">Choose a room icon</label>
              <div className="selected-emoji-preview">{selectedEmoji}</div>
              <div className="modal-emoji-grid">
                {ROOM_EMOJIS.map((e) => (
                  <div
                    key={e}
                    className={`emoji-option ${selectedEmoji === e ? "selected" : ""}`}
                    onClick={() => setSelectedEmoji(e)}
                  >
                    {e}
                  </div>
                ))}
              </div>
            </div>

            {/* Room name */}
            <div className="modal-form-group">
              <label className="modal-form-label">Room Name</label>
              <input
                className="modal-form-input"
                type="text"
                placeholder="e.g. General, Gaming, Study Group…"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createRoom(); }}
                autoFocus
              />
            </div>

            <button className="modal-btn" onClick={createRoom} disabled={loading}>
              {loading ? <span className="loading-spinner" /> : "✨"}
              {loading ? " Creating…" : " Create Room"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
