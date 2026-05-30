// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from 'react';
import API from "../api/axiosInstance";

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
  logout: () => {},
  refreshUser: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const data = await API.unwrap(API.get('/admins/me')); // update to your exact route if different (e.g., /auth/me)
      setUser(data);
      return data;
    } catch (err) {
      console.error('refreshUser failed', err);
      setUser(null);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
