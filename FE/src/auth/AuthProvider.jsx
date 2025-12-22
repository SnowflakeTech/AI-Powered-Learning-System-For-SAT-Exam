import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/apiClient.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { uid, email, username, role }
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const isAuthenticated = !!token;

  // khi refresh trang, nếu có token thì fetch /user/me
  useEffect(() => {
    const boot = async () => {
      if (!token) return;
      try {
        const me = await apiGet("/user/me");
        setUser(me?.data || null);
      } catch (e) {
        console.warn("auth boot failed", e.message);
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
      }
    };
    boot();
  }, [token]);

  const login = async (email, password) => {
    const res = await apiPost("/auth/login", { email, password });
    const accessToken = res?.data?.accessToken;
    if (!accessToken) throw new Error(res?.message || "Login failed");

    localStorage.setItem("token", accessToken);
    setToken(accessToken);

    // decode role nhanh để UI phản hồi ngay
    const payload = decodeJwt(accessToken);
    setUser((prev) => ({ ...(prev || {}), uid: payload?.id, role: payload?.role }));

    // lấy me chuẩn
    const me = await apiGet("/user/me");
    setUser(me?.data || null);
  };

  const register = async (username, email, password) => {
    await apiPost("/user/register", { username, email, password });
    return true;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, isAuthenticated, login, register, logout }),
    [user, token, isAuthenticated]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
