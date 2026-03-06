"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import {
  KeyIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

type PageTheme = "dark" | "light";

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [targetEmail, setTargetEmail] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const [pageTheme, setPageTheme] = useState<PageTheme>("dark");

  const [showLogoutAfterChange, setShowLogoutAfterChange] = useState(false);
  const [showChangeFailed, setShowChangeFailed] = useState(false);
  const [failMsg, setFailMsg] = useState("Change password failed.");

  const [showAdminConfirmReset, setShowAdminConfirmReset] = useState(false);
  const [showAdminResult, setShowAdminResult] = useState(false);
  const [adminResultMsg, setAdminResultMsg] = useState("");

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.role !== "admin" && data.role !== "co_admin") {
          router.replace("/dashboard");
          return;
        }
        setUser(data);
      })
      .finally(() => setLoadingUser(false));
  }, [router]);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? (localStorage.getItem("page-theme") as PageTheme | null)
        : null;

    if (saved === "dark" || saved === "light") {
      setPageTheme(saved);
    }
  }, []);

  const setTheme = (theme: PageTheme) => {
    setPageTheme(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("page-theme", theme);
      window.dispatchEvent(new Event("page-theme-changed"));
    }
  };

  const changeMyPassword = async () => {
    if (!currentPassword || !newPassword) {
      setFailMsg("Please fill in both current and new password.");
      setShowChangeFailed(true);
      return;
    }

    if (newPassword.length < 8) {
      setFailMsg("New password must be at least 8 characters.");
      setShowChangeFailed(true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setFailMsg(data?.error || "Failed to change password.");
        setShowChangeFailed(true);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setShowLogoutAfterChange(true);
    } catch {
      setFailMsg("Network error. Please try again.");
      setShowChangeFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const confirmLogoutNow = async () => {
    setSaving(true);
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" }).catch(() => null);
      router.replace("/login");
    } finally {
      setSaving(false);
      setShowLogoutAfterChange(false);
    }
  };

  const openAdminResetDialog = () => {
    const email = targetEmail.trim().toLowerCase();

    if (!email || !adminNewPassword) {
      setAdminResultMsg("Please fill in email and new password.");
      setShowAdminResult(true);
      return;
    }

    if (adminNewPassword.length < 8) {
      setAdminResultMsg("New password must be at least 8 characters.");
      setShowAdminResult(true);
      return;
    }

    setShowAdminConfirmReset(true);
  };

  const doAdminReset = async () => {
    const email = targetEmail.trim().toLowerCase();

    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, newPassword: adminNewPassword }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setAdminResultMsg(data?.error || "Failed to reset password.");
        setShowAdminResult(true);
        return;
      }

      setAdminResultMsg(`Password reset successful for: ${email}`);
      setShowAdminResult(true);

      setTargetEmail("");
      setAdminNewPassword("");
    } catch {
      setAdminResultMsg("Network error. Please try again.");
      setShowAdminResult(true);
    } finally {
      setResetting(false);
      setShowAdminConfirmReset(false);
    }
  };

  const pageWrap =
    pageTheme === "dark"
      ? "text-slate-100"
      : "text-slate-900";

  const cardCls =
    pageTheme === "dark"
      ? "bg-white/[0.04] border border-cyan-300/12 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-md"
      : "bg-white/85 border border-slate-200 shadow-[0_10px_28px_rgba(15,23,42,0.08)]";

  const inputCls =
    pageTheme === "dark"
      ? "w-full px-4 py-3 rounded-2xl border border-cyan-300/12 bg-white/[0.04] text-white placeholder:text-cyan-100/35 shadow-sm outline-none focus:ring-4 focus:ring-cyan-400/10 focus:border-cyan-300/25 disabled:opacity-70"
      : "w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-400 disabled:opacity-70";

  const muted = pageTheme === "dark" ? "text-cyan-100/65" : "text-slate-600";
  const heading = pageTheme === "dark" ? "text-white" : "text-slate-900";

  const themeLabel = useMemo(() => {
    return pageTheme === "dark" ? "Dark Neon" : "Clean Light";
  }, [pageTheme]);

  if (loadingUser || !user) {
    return (
      <div className="min-h-full grid place-items-center p-6">
        <div className={`${cardCls} rounded-2xl p-6`}>Loading…</div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 md:p-10 ${pageWrap}`}>
      <ConfirmDialog
        open={showLogoutAfterChange}
        title="Logout"
        message="Password changed successfully. Do you want to logout now?"
        confirmText="Logout"
        cancelText="Stay"
        danger
        loading={saving}
        onConfirm={confirmLogoutNow}
        onCancel={() => setShowLogoutAfterChange(false)}
      />

      <ConfirmDialog
        open={showChangeFailed}
        title="Change Password Failed"
        message={failMsg}
        confirmText="OK"
        cancelText=""
        loading={false}
        onConfirm={() => setShowChangeFailed(false)}
        onCancel={() => setShowChangeFailed(false)}
      />

      <ConfirmDialog
        open={showAdminConfirmReset}
        title="Reset Password"
        message={`Are you sure you want to reset password for: ${targetEmail.trim().toLowerCase()}?`}
        confirmText={resetting ? "Resetting..." : "Reset"}
        cancelText="Cancel"
        danger
        loading={resetting}
        onConfirm={doAdminReset}
        onCancel={() => setShowAdminConfirmReset(false)}
      />

      <ConfirmDialog
        open={showAdminResult}
        title="Admin"
        message={adminResultMsg}
        confirmText="OK"
        cancelText=""
        loading={false}
        onConfirm={() => setShowAdminResult(false)}
        onCancel={() => setShowAdminResult(false)}
      />

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-4xl md:text-5xl font-extrabold ${heading}`}>
            Settings
          </h1>
          <p className={`mt-2 ${muted}`}>
            Signed in as{" "}
            <span className={pageTheme === "dark" ? "font-semibold text-white" : "font-semibold text-slate-900"}>
              {user.name}
            </span>{" "}
            <span className={muted}>({user.role})</span>
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="space-y-6">
            <div className={`${cardCls} rounded-3xl p-6`}>
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-cyan-400/12 border border-cyan-300/15 text-cyan-100 grid place-items-center">
                  <KeyIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-2xl font-extrabold ${pageTheme === "dark" ? "text-emerald-200" : "text-emerald-700"}`}>
                    Change Password
                  </h2>
                  <p className={`mt-1 ${muted}`}>
                    Enter your current password and a new password{" "}
                    <span className={pageTheme === "dark" ? "text-white font-semibold" : "text-slate-900 font-semibold"}>
                      (min 8 characters)
                    </span>.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${heading}`}>
                    Current Password
                  </label>
                  <input
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    type="password"
                    placeholder="Enter current password"
                    disabled={saving}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${heading}`}>
                    New Password
                  </label>
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    placeholder="Enter new password"
                    disabled={saving}
                    className={inputCls}
                  />
                </div>

                <button
                  onClick={changeMyPassword}
                  disabled={saving}
                  className="mt-2 px-4 py-3 rounded-2xl bg-cyan-500/90 text-slate-950 font-extrabold hover:bg-cyan-400 transition shadow-[0_0_18px_rgba(34,211,238,0.18)] disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Password"}
                </button>
              </div>
            </div>

            {user.role === "admin" && (
              <div className={`${cardCls} rounded-3xl p-6`}>
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/12 border border-indigo-300/15 text-indigo-200 grid place-items-center">
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-extrabold ${pageTheme === "dark" ? "text-indigo-200" : "text-indigo-700"}`}>
                      Admin: Reset User Password
                    </h2>
                    <p className={`mt-1 ${muted}`}>
                      Reset a user password directly from the admin panel.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${heading}`}>
                      User Email
                    </label>
                    <input
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      type="email"
                      placeholder="e.g. staff@email.com"
                      disabled={resetting}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${heading}`}>
                      New Password for User
                    </label>
                    <input
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      type="password"
                      placeholder="Enter new password for this user"
                      disabled={resetting}
                      className={inputCls}
                    />
                  </div>

                  <button
                    onClick={openAdminResetDialog}
                    disabled={resetting}
                    className="mt-2 px-4 py-3 rounded-2xl bg-indigo-500/90 text-white font-extrabold hover:bg-indigo-400 transition disabled:opacity-70"
                  >
                    {resetting ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className={`${cardCls} rounded-3xl p-6`}>
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-cyan-400/12 border border-cyan-300/15 text-cyan-100 grid place-items-center">
                  <PaintBrushIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-2xl font-extrabold ${heading}`}>Appearance</h2>
                  <p className={`mt-1 ${muted}`}>
                    Change how the page area looks. Sidebar stays fixed neon style.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme("dark")}
                  className={`rounded-3xl border p-5 text-left transition ${
                    pageTheme === "dark"
                      ? "border-cyan-300/30 bg-cyan-400/10"
                      : pageTheme === "light"
                      ? "border-slate-200 bg-white/70 hover:bg-white"
                      : "border-cyan-300/12 bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <MoonIcon className="w-7 h-7 text-cyan-200" />
                    {pageTheme === "dark" && <CheckCircleIcon className="w-5 h-5 text-cyan-200" />}
                  </div>
                  <div className={`mt-4 text-lg font-extrabold ${pageTheme === "light" ? "text-slate-900" : "text-white"}`}>
                    Dark Neon
                  </div>
                  <div className={`mt-1 text-sm ${pageTheme === "light" ? "text-slate-600" : "text-cyan-100/65"}`}>
                    Premium dark glass look with neon page cards.
                  </div>
                </button>

                <button
                  onClick={() => setTheme("light")}
                  className={`rounded-3xl border p-5 text-left transition ${
                    pageTheme === "light"
                      ? "border-cyan-300/30 bg-cyan-400/8"
                      : pageTheme === "dark"
                      ? "border-cyan-300/12 bg-white/[0.04]"
                      : "border-slate-200 bg-white/70 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <SunIcon className={`w-7 h-7 ${pageTheme === "light" ? "text-amber-500" : "text-cyan-200"}`} />
                    {pageTheme === "light" && <CheckCircleIcon className="w-5 h-5 text-cyan-500" />}
                  </div>
                  <div className={`mt-4 text-lg font-extrabold ${pageTheme === "dark" ? "text-white" : "text-slate-900"}`}>
                    Clean Light
                  </div>
                  <div className={`mt-1 text-sm ${pageTheme === "dark" ? "text-cyan-100/65" : "text-slate-600"}`}>
                    Bright page background with cleaner reading feel.
                  </div>
                </button>
              </div>

              <div className={`mt-5 rounded-2xl border p-4 ${
                pageTheme === "dark"
                  ? "border-cyan-300/12 bg-white/[0.04]"
                  : "border-slate-200 bg-slate-50"
              }`}>
                <div className={`text-sm font-semibold ${heading}`}>Current page theme</div>
                <div className={`mt-1 ${muted}`}>{themeLabel}</div>
              </div>
            </div>

            <div className={`${cardCls} rounded-3xl p-6`}>
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-cyan-400/12 border border-cyan-300/15 text-cyan-100 grid place-items-center">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-2xl font-extrabold ${heading}`}>Interface Preview</h2>
                  <p className={`mt-1 ${muted}`}>
                    Quick preview of the current style.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className={`rounded-3xl p-5 border ${
                  pageTheme === "dark"
                    ? "border-cyan-300/12 bg-[#081522]"
                    : "border-slate-200 bg-white"
                }`}>
                  <div className={`text-sm font-semibold ${heading}`}>Sample Header</div>
                  <div className={`mt-2 text-xs ${muted}`}>This shows how text looks in the selected page theme.</div>
                </div>

                <div className={`rounded-3xl p-5 border ${
                  pageTheme === "dark"
                    ? "border-cyan-300/12 bg-white/[0.04]"
                    : "border-slate-200 bg-slate-50"
                }`}>
                  <div className={`text-sm font-semibold ${heading}`}>Sample Card</div>
                  <div className={`mt-2 text-xs ${muted}`}>
                    Cards can stay premium and slightly accented in both modes.
                  </div>
                </div>
              </div>
            </div>

            <div className={`${cardCls} rounded-3xl p-6`}>
              <h2 className={`text-xl font-extrabold ${heading}`}>Extra ideas added</h2>
              <div className={`mt-4 space-y-3 text-sm ${muted}`}>
                <div>• Page-only dark/light mode toggle</div>
                <div>• Better card grouping for password and admin actions</div>
                <div>• Live interface preview inside settings</div>
                <div>• Sidebar remains fixed neon for brand consistency</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-8 text-xs ${muted}`}>
          Tip: The page theme is saved on this browser and applied to the main content area only.
        </div>
      </div>
    </div>
  );
}