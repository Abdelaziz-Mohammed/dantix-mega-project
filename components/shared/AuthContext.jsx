"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { loginRequest, registerRequest } from "@/lib/authService";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = window.localStorage.getItem("auth_token");
    const storedUser = window.localStorage.getItem("auth_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
    setInitializing(false);
  }, []);

  const handleLogin = useCallback(
    async (credentials) => {
      const data = await loginRequest(credentials);
      const nextUser = {
        userName: data.userName,
        email: data.email,
        fullName: data.fullName,
        tokenType: data.tokenType,
        expiration: data.expiration,
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_token", data.token);
        window.localStorage.setItem("auth_user", JSON.stringify(nextUser));
      }
      setToken(data.token);
      setUser(nextUser);
      router.push("/dashboard");
    },
    [router]
  );

  const handleRegister = useCallback(async (payload) => {
    const data = await registerRequest(payload);
    return data;
  }, []);

  const handleLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("auth_token");
      window.localStorage.removeItem("auth_user");
    }
    setToken(null);
    setUser(null);
    router.push("/auth/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      isAuthenticated: !!token,
    }),
    [user, token, initializing, handleLogin, handleRegister, handleLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
