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
  attachTabSessionResponder,
  clearBrowserTabDenied,
  clearBrowserSessionState,
  getBrowserTabSessionId,
  hasConflictingTabSession,
  hasActiveBrowserSessionMarker,
  isBrowserSessionExpired,
  markBrowserTabDenied,
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
  initialUser = null,
  redirectTo = "/",
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
  redirectTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [loading, setLoading] = useState(initialUser ? false : true);

  const mountedRef = useRef(true);
  const fetchedOnceRef = useRef(Boolean(initialUser));

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
        const tabSessionId = getBrowserTabSessionId();

        if (!hasActiveBrowserSessionMarker() || !tabSessionId) {
          markBrowserTabDenied();
          if (mountedRef.current) {
            setUser(null);
          }

          if (redirectOnFail && !isPublicRoute) {
            router.replace(redirectTo);
          }
          return;
        }

        const hasConflict = await hasConflictingTabSession(tabSessionId);

        if (hasConflict) {
          markBrowserTabDenied();
          clearBrowserSessionState();

          if (mountedRef.current) {
            setUser(null);
          }

          if (redirectOnFail && !isPublicRoute) {
            router.replace(redirectTo);
          }
          return;
        }

        if (mountedRef.current) {
          setUser(data);
        }

        clearBrowserTabDenied();
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

    if (!hasActiveBrowserSessionMarker() || !getBrowserTabSessionId()) {
      markBrowserTabDenied();
      clearBrowserSessionState();

      if (mountedRef.current) {
        setUser(null);
        setLoading(false);
      }

      router.replace(redirectTo);

      return () => {
        mountedRef.current = false;
      };
    }

    const sessionExpired = isBrowserSessionExpired();

    if (sessionExpired) {
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
    } else if (mountedRef.current) {
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchMe, initialUser, isPublicRoute, redirectTo, router]);

  useEffect(() => {
    if (!user) return;

    const tabSessionId = getBrowserTabSessionId();
    if (!tabSessionId) return;

    return attachTabSessionResponder(tabSessionId);
  }, [user]);

  const refreshUser = useCallback(async () => {
    await fetchMe({ silent: true, redirectOnFail: false });
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      clearBrowserTabDenied();
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
