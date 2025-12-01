"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [initializing, isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
