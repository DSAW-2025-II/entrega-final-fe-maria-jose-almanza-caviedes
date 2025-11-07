import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../utils/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!token) {
        setUser(null);
        return;
      }
      setLoadingProfile(true);
      try {
        const { data } = await api.get("/auth/me");
        if (!cancelled) setUser(data.user || null);
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken("");
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    if (userData) {
      setUser(userData);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("logout request failed", err?.message || err);
    } finally {
      setToken("");
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    if (!token) return null;
    const { data } = await api.get("/auth/me");
    setUser(data.user || null);
    return data.user || null;
  };

  const updateProfile = async (payload) => {
    if (!token) throw new Error("No autenticado");
    const { data } = await api.put("/auth/me", payload);
    setUser(data.user || null);
    return data.user || null;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login: handleLogin,
  logout: handleLogout,
      refreshProfile,
      updateProfile,
      loadingProfile
    }),
    [token, user, loadingProfile]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
