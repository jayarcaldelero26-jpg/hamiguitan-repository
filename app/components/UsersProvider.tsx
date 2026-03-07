"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";

export type UserRole = "admin" | "co_admin" | "staff";

export type EmploymentType =
  | "Job Order"
  | "Contract of Service"
  | "Casual"
  | "Permanent"
  | "";

export type UserRow = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  userCode?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  suffix?: string | null;
  birthdate?: string | null;
  position?: string | null;
  department?: string | null;
  employmentType?: EmploymentType | null;
  contact?: string | null;
  createdAt?: string | null;
};

type UsersContextType = {
  users: UserRow[];
  loading: boolean;
  refreshing: boolean;
  refreshUsers: (opts?: { silent?: boolean }) => Promise<void>;
  setUsers: Dispatch<SetStateAction<UserRow[]>>;
};

const UsersContext = createContext<UsersContextType | undefined>(undefined);

function normalizeUserRow(u: any): UserRow {
  return {
    ...u,
    id: Number(u.id),
    userCode:
      u?.userCode !== null && u?.userCode !== undefined ? String(u.userCode) : null,
    contact:
      u?.contact !== null && u?.contact !== undefined ? String(u.contact) : null,
    name: u?.name ? String(u.name) : "",
    email: u?.email ? String(u.email) : "",
    role: (u?.role || "staff") as UserRole,
    firstName: u?.firstName ?? null,
    middleName: u?.middleName ?? null,
    lastName: u?.lastName ?? null,
    suffix: u?.suffix ?? null,
    birthdate: u?.birthdate ?? null,
    position: u?.position ?? null,
    department: u?.department ?? null,
    employmentType: (u?.employmentType ?? null) as EmploymentType | null,
    createdAt: u?.createdAt ?? null,
  };
}

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mountedRef = useRef(true);
  const hasFetchedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const refreshUsers = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;

    try {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      if (!silent) {
        if (!hasFetchedRef.current) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
      }

      const res = await fetch("/api/admin/users", {
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await res.json().catch(() => null);

      if (controller.signal.aborted) return;

      if (!res.ok) {
        console.error("USERS GET FAILED:", res.status, data);
        if (mountedRef.current) {
          setUsers([]);
        }
        return;
      }

      const rows: UserRow[] = Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data)
        ? data
        : [];

      if (!mountedRef.current) return;

      setUsers(rows.map(normalizeUserRow));
      hasFetchedRef.current = true;
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.error("USERS LOAD FAILED:", error);
      if (mountedRef.current) {
        setUsers([]);
      }
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!hasFetchedRef.current) {
      refreshUsers();
    }

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [refreshUsers]);

  const value = useMemo<UsersContextType>(
    () => ({
      users,
      loading,
      refreshing,
      refreshUsers,
      setUsers,
    }),
    [users, loading, refreshing, refreshUsers]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) {
    throw new Error("useUsers must be used inside UsersProvider");
  }
  return ctx;
}