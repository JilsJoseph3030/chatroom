import React, { useState, useEffect, useRef, useCallback } from "react";
import { db, auth } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, doc, updateDoc, deleteDoc,
  arrayUnion, arrayRemove, setDoc, deleteField,
} from "firebase/firestore";
import { useToast } from "./Toast";

/* ─── Constants ─────────────────────────────────── */
const EMOJIS = [
  "😀","😂","🥰","😎","🤔","😢","😡","😮","🥳","😴",
  "🤣","😊","🙈","💀","🤗","😏","😅","🤩","😬","🥺",
  "👍","👎","❤️","🔥","🎉","🙌","💯","✅","💪","👋",
  "🚀","⭐","💡","🎮","🎵","🎨","📚","🌈","🍕","☕",
];

const REACTIONS = ["👍","❤️","😂","😮","😢","👏"];

/* ─── Helpers ────────────────────────────────────── */
function getInitials(email, displayName) {
  if (displayName) {
    return displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  return email ? email[0].toUpperCase() : "?";
}

function isImageUrl(text) {
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(text.trim());
}

function formatTime(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts) {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Component ──────────────────────────────────── */
export default function ChatRoom() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [roomData,        setRoomData]        = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [text,            setText]            = useState("");
  const [typingUsers,     setTypingUsers]     = useState([]);
  const [onlineMembers,   setOnlineMembers]   = useState([]);
  const [showEmoji,       setShowEmoji]       = useState(false);
  const [reactionTarget,  setReactionTarget]  = useState(null);
  const [showSidebar,     setShowSidebar]     = useState(true);
  const [showScrollBtn,   setShowScrollBtn]   = useState(false);

  const messagesAreaRef = useRef(null);
  const messagesEndRef  = useRef(null);
  const textareaRef     = useRef(null);
  const typingTimerRef  = useRef(null);

  const currentUser = auth.currentUser;

  /* ── Clear typing field in Firestore ── */
  const clearTyping = useCallback(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (!auth.currentUser) return;
    updateDoc(doc(db, "rooms", id), {
      [`typing.${auth.currentUser.uid}`]: deleteField(),
    }).catch(() => {});
  }, [id]);

  /* ── Room document (for name, emoji, typing) ── */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setRoomData(data);
      // Typing: filter out current user and stale entries (>4 s)
      const typing = data.typing || {};
      const now = Date.now();
      const active = Object.entries(typing)
        .filter(([uid, info]) =>
          uid !== currentUser.uid &&
          info?.ts &&
          now - info.ts < 4500
        )
        .map(([, info]) => info.name || "Someone");
      setTypingUsers(active);
    });
    return () => unsub();
  }, [id, currentUser.uid]);

  /* ── Messages ── */
  useEffect(() => {
    const q = query(
      collection(db, "rooms", id, "messages"),
      orderBy("createdAt")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [id]);

  /* ── Presence (join/leave subcollection) ── */
  useEffect(() => {
    const presenceRef = doc(db, "rooms", id, "presence", currentUser.uid);
    setDoc(presenceRef, {
      email:       currentUser.email,
      displayName: currentUser.displayName || currentUser.email?.split("@")[0],
      joinedAt:    serverTimestamp(),
    }).catch(() => {});

    const unsub = onSnapshot(collection(db, "rooms", id, "presence"), (snap) => {
      setOnlineMembers(snap.docs.map((d) => d.data()));
    });

    return () => {
      deleteDoc(presenceRef).catch(() => {});
      clearTyping();
      unsub();
    };
  }, [id, currentUser, clearTyping]);

  /* ── Auto-scroll when messages update ── */
  useEffect(() => {
    const area = messagesAreaRef.current;
    if (!area) return;
    const gap = area.scrollHeight - area.scrollTop - area.clientHeight;
    if (gap < 180) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  /* ── Scroll button visibility ── */
  const handleScroll = () => {
    const area = messagesAreaRef.current;
    if (!area) return;
    setShowScrollBtn(area.scrollHeight - area.scrollTop - area.clientHeight > 250);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  };

  /* ── Send message ── */
  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    clearTyping();
    try {
      await addDoc(collection(db, "rooms", id, "messages"), {
        text:        trimmed,
        user:        currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split("@")[0],
        createdAt:   serverTimestamp(),
        reactions:   {},
      });
    } catch {
      toast("Failed to send message.", "error");
    }
  };

  /* ── Typing detection ── */
  const handleTyping = (e) => {
    setText(e.target.value);
    // Auto-resize textarea
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 130) + "px"; }

    // Update Firestore typing field (client timestamp to avoid Timestamp conversion)
    updateDoc(doc(db, "rooms", id), {
      [`typing.${currentUser.uid}`]: {
        name: currentUser.displayName || currentUser.email?.split("@")[0],
        ts:   Date.now(),
      },
    }).catch(() => {});

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(clearTyping, 3000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── Reactions ── */
  const toggleReaction = async (msgId, emoji) => {
    const msg   = messages.find((m) => m.id === msgId);
    const users = (msg?.reactions?.[emoji]) || [];
    const msgRef = doc(db, "rooms", id, "messages", msgId);
    try {
      if (users.includes(currentUser.email)) {
        await updateDoc(msgRef, { [`reactions.${emoji}`]: arrayRemove(currentUser.email) });
      } else {
        await updateDoc(msgRef, { [`reactions.${emoji}`]: arrayUnion(currentUser.email) });
      }
    } catch {
      toast("Failed to update reaction.", "error");
    }
    setReactionTarget(null);
  };

  /* ── Delete message ── */
  const deleteMessage = async (msgId) => {
    try {
      await deleteDoc(doc(db, "rooms", id, "messages", msgId));
      toast("Message deleted.", "info");
    } catch {
      toast("Failed to delete.", "error");
    }
  };

  /* ── Emoji picker insert ── */
  const insertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  /* ── Date dividers ── */
  const getDateLabel = (msg, idx) => {
    if (idx === 0) return formatDate(msg.createdAt);
    const prev = messages[idx - 1];
    const prevDate = prev.createdAt?.toDate?.()?.toDateString?.();
    const curDate  = msg.createdAt?.toDate?.()?.toDateString?.();
    return prevDate !== curDate ? formatDate(msg.createdAt) : null;
  };

  /* ── Close popups on outside click ── */
  const handleAreaClick = () => {
    setShowEmoji(false);
    setReactionTarget(null);
  };

  /* ─── Render ─────────────────────────────────────── */
  return (
    <div className="chatroom-layout" onClick={handleAreaClick}>
      {/* ── Sidebar (online members) ── */}
      <div className={`chatroom-sidebar${showSidebar ? "" : " collapsed"}`}>
        <div className="sidebar-section-header">
          <p className="sidebar-section-title">
            <span className="sidebar-online-dot" />
            Online — {onlineMembers.length}
          </p>
        </div>
        <div className="sidebar-members">
          {onlineMembers.map((m, i) => (
            <div key={i} className="sidebar-member">
              <div className="member-avatar">
                {getInitials(m.email, m.displayName)}
              </div>
              <span className="member-name">{m.displayName || m.email?.split("@")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Chat ── */}
      <div className="chatroom-main">
        {/* Header */}
        <div className="chatroom-header">
          <div className="chatroom-header-left">
            <button className="back-btn" onClick={() => navigate("/rooms")}>
              ← Back
            </button>
            <div className="room-header-info">
              <h2 className="room-header-name">
                {roomData?.emoji || "💬"} {roomData?.name || "Chat Room"}
              </h2>
              <p className="room-header-status">{onlineMembers.length} online</p>
            </div>
          </div>
          <div className="chatroom-header-right">
            <button
              className="icon-btn"
              onClick={(e) => { e.stopPropagation(); setShowSidebar((s) => !s); }}
              title="Toggle members"
            >
              👥
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          className="messages-area"
          ref={messagesAreaRef}
          onScroll={handleScroll}
        >
          {messages.map((msg, idx) => {
            const isOwn      = msg.user === currentUser.email;
            const reactions  = msg.reactions || {};
            const hasReact   = Object.values(reactions).some((arr) => arr?.length > 0);
            const dateLabel  = getDateLabel(msg, idx);

            return (
              <React.Fragment key={msg.id}>
                {/* Date divider */}
                {dateLabel && (
                  <div className="msg-date-divider">
                    <div className="msg-date-line" />
                    <span>{dateLabel}</span>
                    <div className="msg-date-line" />
                  </div>
                )}

                {/* Message row */}
                <div className={`message-wrapper ${isOwn ? "own" : "other"}`}>
                  {/* Sender row (avatar + name) for others */}
                  {!isOwn && (
                    <div className="msg-sender-row">
                      <div className="msg-avatar">
                        {getInitials(msg.user, msg.displayName)}
                      </div>
                      <span className="msg-sender-name">
                        {msg.displayName || msg.user?.split("@")[0]}
                      </span>
                    </div>
                  )}

                  <div className="message-bubble-wrapper">
                    {/* Reaction picker popup */}
                    {reactionTarget === msg.id && (
                      <div
                        className="reaction-picker-popup"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {REACTIONS.map((r) => (
                          <button
                            key={r}
                            className="reaction-emoji-btn"
                            onClick={() => toggleReaction(msg.id, r)}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="msg-actions">
                      <button
                        className="msg-action-btn"
                        title="React"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReactionTarget(reactionTarget === msg.id ? null : msg.id);
                          setShowEmoji(false);
                        }}
                      >
                        😊
                      </button>
                      {isOwn && (
                        <button
                          className="msg-action-btn delete"
                          title="Delete"
                          onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className="message-bubble">
                      {isImageUrl(msg.text) ? (
                        <img
                          src={msg.text}
                          alt="Shared"
                          className="msg-image"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className="msg-text">{msg.text}</div>
                      )}
                      <span className="msg-time">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>

                  {/* Reaction chips */}
                  {hasReact && (
                    <div className="msg-reactions">
                      {Object.entries(reactions).map(([emoji, users]) => {
                        if (!users?.length) return null;
                        return (
                          <button
                            key={emoji}
                            className={`reaction-chip ${users.includes(currentUser.email) ? "active" : ""}`}
                            onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }}
                          >
                            {emoji}
                            <span className="reaction-count">{users.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        <div className="typing-indicator">
          {typingUsers.length > 0 && (
            <>
              <div className="typing-dots">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
              <span className="typing-text">
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
              </span>
            </>
          )}
        </div>

        {/* Scroll-to-bottom FAB */}
        {showScrollBtn && (
          <button className="scroll-fab" onClick={scrollToBottom}>↓</button>
        )}

        {/* Input area */}
        <div
          className="chat-input-area"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Emoji popup */}
          {showEmoji && (
            <div className="emoji-popup">
              <div className="emoji-popup-grid">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    className="emoji-popup-btn"
                    onClick={() => insertEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="chat-input-row">
            <button
              className={`emoji-trigger-btn${showEmoji ? " active" : ""}`}
              onClick={() => { setShowEmoji((s) => !s); setReactionTarget(null); }}
              title="Emoji"
            >
              😊
            </button>
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              value={text}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              rows={1}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!text.trim()}
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
