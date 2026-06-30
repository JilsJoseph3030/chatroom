import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4200);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = { success: "✅", error: "❌", info: "💬" };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            onClick={() => remove(t.id)}
          >
            <span className="toast-icon">{icons[t.type] || icons.info}</span>
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close" onClick={(e) => { e.stopPropagation(); remove(t.id); }}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
