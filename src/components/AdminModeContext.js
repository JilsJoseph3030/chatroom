import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase";

const AdminModeContext = createContext();

export const useAdminMode = () => useContext(AdminModeContext);

export const AdminModeProvider = ({ children }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user && user.email === process.env.REACT_APP_ADMIN_EMAIL) {
        setIsSuperAdmin(true);
        setIsAdminMode(true); // Default on when admin logs in
      } else {
        setIsSuperAdmin(false);
        setIsAdminMode(false);
      }
    });
    return () => unsub();
  }, []);

  const toggleAdminMode = () => {
    if (isSuperAdmin) {
      setIsAdminMode(!isAdminMode);
    }
  };

  return (
    <AdminModeContext.Provider value={{ isAdminMode, isSuperAdmin, toggleAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
};
