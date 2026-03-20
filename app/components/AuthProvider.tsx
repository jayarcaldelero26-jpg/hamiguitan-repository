"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearBrowserSessionState,
  hasActiveBrowserSessionMarker,
  isBrowserSessionExpired,
  markBrowserSessionActive,
} from "@/app/lib/authSession";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "co_admin" | "staff" | string;
  avatar?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  redirectTo = "/",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const fetchedOnceRef = useRef(false);

  const isPublicRoute =
    pathname === "/login" || pathname === "/register" || pathname === "/";

  const fetchMe = useCallback(
    async ({
      silent = false,
      redirectOnFail = true,
    }: {
      silent?: boolean;
      redirectOnFail?: boolean;
    } = {}) => {
      if (!silent && mountedRef.current) {
        setLoading(true);
      }

      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (mountedRef.current) {
            setUser(null);
          }

          if (redirectOnFail && !isPublicRoute) {
            router.replace(redirectTo);
          }
          return;
        }

        const data = await res.json();

        if (mountedRef.current) {
          setUser(data);
        }

        markBrowserSessionActive();
      } catch {
        if (mountedRef.current) {
          setUser(null);
        }

        if (redirectOnFail && !isPublicRoute) {
          router.replace(redirectTo);
        }
      } finally {
        if (!silent && mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [router, redirectTo, isPublicRoute]
  );

  useEffect(() => {
    mountedRef.current = true;

    if (isPublicRoute) {
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    if (!hasActiveBrowserSessionMarker() || isBrowserSessionExpired()) {
      clearBrowserSessionState();

      void fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      }).finally(() => {
        if (mountedRef.current) {
          setUser(null);
          setLoading(false);
        }
        router.replace(redirectTo);
      });

      return () => {
        mountedRef.current = false;
      };
    }

    if (!fetchedOnceRef.current) {
      fetchedOnceRef.current = true;
      fetchMe({ silent: false, redirectOnFail: true });
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchMe, isPublicRoute, redirectTo, router]);

  const refreshUser = useCallback(async () => {
    await fetchMe({ silent: true, redirectOnFail: false });
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      clearBrowserSessionState();

      if (!res.ok) return false;

      if (mountedRef.current) {
        setUser(null);
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      refreshUser,
      logout,
    }),
    [user, loading, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider />");
  }

  return ctx;
}
