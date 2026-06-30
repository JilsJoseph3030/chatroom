import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function ChatRooms() {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "rooms"), (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const createRoom = async () => {
    if (!roomName.trim()) return;
    await addDoc(collection(db, "rooms"), {
      name: roomName,
      createdBy: auth.currentUser.email,
      createdAt: serverTimestamp()
    });
    setRoomName("");
  };

  return (
    <div className="rooms-container">
      <h2>Chat Rooms</h2>
      <div className="room-input">
        <input
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="New room name..."
        />
        <button onClick={createRoom}>Create</button>
      </div>
      <div className="rooms-list">
        {rooms.map(room => (
          <Link key={room.id} to={`/room/${room.id}`} className="room-card">
            <div className="room-avatar">{room.name.charAt(0).toUpperCase()}</div>
            <div className="room-name">{room.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
