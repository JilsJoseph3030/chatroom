import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, "rooms", id, "messages"),
      orderBy("createdAt")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, "rooms", id, "messages"), {
      text,
      user: auth.currentUser.email,
      createdAt: serverTimestamp()
    });
    setText("");
  };

  return (
    <div className="chatroom-container">
      <div className="chatroom-header">
        <h2>Chat Room</h2>
        <button className="back-btn" onClick={() => navigate("/rooms")}>
          ⬅ Back
        </button>
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.user === auth.currentUser.email ? "my-message" : "other-message"}
          >
            <div className="msg-header">{msg.user}</div>
            <div className="msg-text">{msg.text}</div>
            <div className="msg-time">
              {msg.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
