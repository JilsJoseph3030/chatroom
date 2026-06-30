import React, { useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "./Toast";

export default function Auth() {
  const [isLogin, setIsLogin]         = useState(true);
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async () => {
    if (!email.trim() || !password) {
      toast("Please fill in all fields.", "error");
      return;
    }
    if (!isLogin && !displayName.trim()) {
      toast("Please enter your display name.", "error");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast("Welcome back! 🎉", "success");
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(user, { displayName: displayName.trim() });
        toast("Account created! Let's chat 🚀", "success");
      }
      navigate("/rooms");
    } catch (err) {
      toast(err.message.replace("Firebase: ", ""), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      toast("Signed in with Google! 🎉", "success");
      navigate("/rooms");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast(err.message.replace("Firebase: ", ""), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") handleAuth(); };

  const switchMode = () => {
    setIsLogin(v => !v);
    setEmail(""); setPassword(""); setDisplayName("");
  };

  return (
    <div className="auth-page">
      {/* ── Left Decorative Panel ── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <span className="auth-logo-big">💬</span>
          <h1 className="auth-title-big">ChatRoom</h1>
          <p className="auth-subtitle-big">
            Real-time conversations with anyone, anywhere. Create rooms, react to messages, and vibe together.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">⚡</span>
              Instant real-time messaging
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">😄</span>
              Emoji reactions &amp; picker
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">👥</span>
              Online presence tracking
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🌙</span>
              Beautiful dark &amp; light themes
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">
              {isLogin ? "Welcome back 👋" : "Create account"}
            </h2>
            <p className="auth-form-subtitle">
              {isLogin
                ? "Sign in to continue to ChatRoom."
                : "Join thousands of people already chatting."}
            </p>
          </div>

          {/* Google Sign-In */}
          <button className="google-btn" onClick={handleGoogle} disabled={loading}>
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          {/* Display Name (register only) */}
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={onKey}
                autoFocus
              />
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKey}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-wrapper">
              <input
                className="form-input"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKey}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button className="auth-btn" onClick={handleAuth} disabled={loading}>
            {loading && <span className="loading-spinner" />}
            {loading ? "Please wait…" : (isLogin ? "Sign in" : "Create account")}
          </button>

          {/* Switch mode */}
          <div className="auth-switch">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button className="auth-switch-btn" onClick={switchMode}>
              {isLogin ? " Sign up" : " Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
