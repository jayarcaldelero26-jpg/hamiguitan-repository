"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { repoTheme } from "@/app/lib/repoTheme";
import { useProtectedTheme } from "@/app/components/ProtectedThemeProvider";

type AuditLogRow = {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  file_name: string | null;
  from_path: string | null;
  to_path: string | null;
  created_at: string | null;
};

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

export default function AuditPage() {
  const { user, loading } = useAuth();
  const { theme, dark } = useProtectedTheme();
  const ui = repoTheme(theme);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [error, setError] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    if (loading || !user) return;

    const role = normalizeRole(user.role);
    if (role !== "admin" && role !== "co_admin") {
      setError("You do not have access to view audit logs.");
      setLoadingLogs(false);
      return;
    }

    let active = true;

    (async () => {
      try {
        setLoadingLogs(true);
        setError("");

        const res = await fetch("/api/audit", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json().catch(() => null);
        if (!active) return;

        if (!res.ok) {
          setError(data?.error || "Failed to load audit logs.");
          setLogs([]);
          return;
        }

        setLogs(Array.isArray(data) ? data : []);
      } catch {
        if (!active) return;
        setError("Failed to load audit logs.");
        setLogs([]);
      } finally {
        if (active) {
          setLoadingLogs(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [loading, user]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className={`${ui.card} p-6 md:p-8`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--ui-accent-soft)]">
          Admin Audit Dashboard
        </p>
        <h1 className={`mt-4 text-3xl font-semibold tracking-tight md:text-5xl ${ui.textMain}`}>
          Audit Logs
        </h1>
        <p className={`mt-4 max-w-3xl text-sm leading-7 md:text-base ${ui.textMuted}`}>
          Review recent administrative actions across document edits, folder moves,
          deletions, and other tracked operations.
        </p>

        {error && (
          <div className={`mt-6 rounded-[20px] border px-4 py-3 text-sm ${
            dark
              ? "border-rose-400/20 bg-rose-500/10 text-rose-100"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}>
            {error}
          </div>
        )}

        <div className={`${ui.tableWrap} mt-6`}>
          <div className={`hidden grid-cols-[1.1fr_0.95fr_1fr_1fr_1fr_0.95fr] gap-4 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] md:grid ${ui.tableHead}`}>
            <div>User</div>
            <div>Action</div>
            <div>File Name</div>
            <div>From</div>
            <div>To</div>
            <div>Date / Time</div>
          </div>

          {loadingLogs ? (
            <div className={`px-5 py-8 text-sm ${ui.textMuted}`}>Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className={`px-5 py-8 text-sm ${ui.textMuted}`}>No audit logs found.</div>
          ) : (
            <div className={dark ? "divide-y divide-white/8" : "divide-y divide-black/6"}>
              {logs.map((log) => (
                <article
                  key={log.id}
                  className={`grid gap-4 px-5 py-4 text-sm md:grid-cols-[1.1fr_0.95fr_1fr_1fr_1fr_0.95fr] md:items-start ${ui.textMuted}`}
                >
                  <div>
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.14em] md:hidden ${ui.textSoft}`}>
                      User
                    </div>
                    <div className={`break-words font-medium ${ui.textMain}`}>
                      {log.user_email || "Unknown user"}
                    </div>
                  </div>

                  <div>
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.14em] md:hidden ${ui.textSoft}`}>
                      Action
                    </div>
                    <div className="break-words">{log.action}</div>
                  </div>

                  <div>
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.14em] md:hidden ${ui.textSoft}`}>
                      File Name
                    </div>
                    <div className="break-words">{log.file_name || "-"}</div>
                  </div>

                  <div>
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.14em] md:hidden ${ui.textSoft}`}>
                      From
                    </div>
                    <div className="break-words">{log.from_path || "-"}</div>
                  </div>

                  <div>
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.14em] md:hidden ${ui.textSoft}`}>
                      To
                    </div>
                    <div className="break-words">{log.to_path || "-"}</div>
                  </div>

                  <div>
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.14em] md:hidden ${ui.textSoft}`}>
                      Date / Time
                    </div>
                    <div className="break-words">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
