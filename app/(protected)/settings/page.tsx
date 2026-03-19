"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useAuth } from "@/app/components/AuthProvider";
import {
  KeyIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { repoTheme } from "@/app/lib/repoTheme";
import { useProtectedTheme } from "@/app/components/ProtectedThemeProvider";
type SettingsTab = "security" | "appearance" | "account";

function Skeleton({
  className,
  dark,
}: {
  className: string;
  dark: boolean;
}) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${
        dark ? "bg-white/10" : "bg-slate-200"
      } ${className}`}
    />
  );
}

function SecurityStatCard({
  title,
  value,
  subtitle,
  tone,
  dark,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: "cyan" | "emerald" | "violet" | "amber";
  dark: boolean;
}) {
  const ui = repoTheme(dark ? "dark" : "light");
  const accentCls =
    tone === "emerald"
      ? dark
        ? "bg-[#8EB69B]/55"
        : "bg-[#8EB69B]/70"
      : tone === "violet"
      ? dark
        ? "bg-[#8b92de]/60"
        : "bg-[#9aa2eb]/78"
      : tone === "amber"
      ? dark
        ? "bg-[#d7aa6b]/68"
        : "bg-[#ddb16f]/82"
      : dark
      ? "bg-[#7c8798]/60"
      : "bg-[#a7b0bd]/78";
  const toneCls =
    tone === "emerald"
      ? dark
        ? "text-emerald-200 bg-emerald-400/10 border-emerald-300/20"
        : "text-emerald-700 bg-emerald-50 border-emerald-200"
      : tone === "violet"
      ? dark
        ? "text-violet-200 bg-violet-400/10 border-violet-300/20"
        : "text-violet-700 bg-violet-50 border-violet-200"
      : tone === "amber"
      ? dark
        ? "text-amber-200 bg-amber-400/10 border-amber-300/20"
        : "text-amber-700 bg-amber-50 border-amber-200"
      : dark
      ? "text-cyan-100 bg-cyan-400/10 border-cyan-300/20"
      : "text-cyan-700 bg-cyan-50 border-cyan-200";

  return (
    <div className={`${ui.card} relative overflow-hidden p-5`}>
      <div className={`absolute inset-x-0 top-0 h-2 ${accentCls}`} />
      <div
        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${toneCls}`}
      >
        {title}
      </div>
      <div
        className={`mt-4 text-3xl font-bold tracking-tight ${
          dark ? "text-white" : "text-slate-900"
        }`}
      >
        {value}
      </div>
      <div
        className={`mt-2 text-sm ${
          dark ? "text-cyan-100/65" : "text-slate-600"
        }`}
      >
        {subtitle}
      </div>
    </div>
  );
}

function ChecklistItem({
  label,
  ok,
  dark,
}: {
  label: string;
  ok: boolean;
  dark: boolean;
}) {
  const ui = repoTheme(dark ? "dark" : "light");
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        dark ? "border-white/8 bg-white/[0.03]" : "border-white/50 bg-white/40"
      }`}
    >
      <span
        className={`text-sm ${ui.textMuted}`}
      >
        {label}
      </span>
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
          ok
            ? dark
              ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
            : dark
            ? "border-amber-300/20 bg-amber-400/10 text-amber-200"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
      >
        <CheckCircleIcon className="w-4 h-4" />
        {ok ? "OK" : "Check"}
      </span>
    </div>
  );
}

function TabButton({
  active,
  label,
  icon,
  onClick,
  dark,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  dark: boolean;
}) {
  const ui = repoTheme(dark ? "dark" : "light");
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-3 text-sm transition ${
        active ? ui.buttonPrimary : ui.buttonSecondary
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useAuth();
  const { theme: pageTheme, dark, setTheme } = useProtectedTheme();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const [targetEmail, setTargetEmail] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [showAdminNew, setShowAdminNew] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [activeTab, setActiveTab] = useState<SettingsTab>("security");

  const [showLogoutAfterChange, setShowLogoutAfterChange] = useState(false);
  const [showChangeFailed, setShowChangeFailed] = useState(false);
  const [failMsg, setFailMsg] = useState("Change password failed.");

  const [showAdminConfirmReset, setShowAdminConfirmReset] = useState(false);
  const [showAdminResult, setShowAdminResult] = useState(false);
  const [adminResultMsg, setAdminResultMsg] = useState("");

  const normalizedRole = (user?.role || "").trim().toLowerCase();
  const canAccessSettings =
    normalizedRole === "admin" ||
    normalizedRole === "co_admin" ||
    normalizedRole === "staff";

  const canAdminReset = normalizedRole === "admin";

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canAccessSettings) {
      router.replace("/dashboard");
    }
  }, [loadingUser, user, canAccessSettings, router]);

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  }, [newPassword]);

  const passwordStrengthLabel = useMemo(() => {
    if (!newPassword) return "No password entered";
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength === 2) return "Fair";
    if (passwordStrength === 3) return "Strong";
    return "Very strong";
  }, [newPassword, passwordStrength]);

  const strengthBarCls =
    passwordStrength <= 1
      ? "bg-rose-500"
      : passwordStrength === 2
      ? "bg-amber-500"
      : passwordStrength === 3
      ? "bg-cyan-500"
      : "bg-emerald-500";

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
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => null);
      router.replace("/login");
    } finally {
      setSaving(false);
      setShowLogoutAfterChange(false);
    }
  };

  const openAdminResetDialog = () => {
    if (!canAdminReset) return;

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
    if (!canAdminReset) return;

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

  const ui = repoTheme(pageTheme);

  const pageWrap = ui.page;
  const heading = ui.textMain;
  const muted = ui.textMuted;

  const cardCls = ui.card;

  const inputCls = `${ui.input.replace("pl-11", "pl-4")} pr-12`;

  const previewCardCls = `${ui.cardSoft} p-5`;

  const themeLabel = pageTheme === "dark" ? "Dark Mode" : "Light Mode";

  const adminToolsLabel = canAdminReset ? "Enabled" : "Not Available";

  if (loadingUser || !user) {
    return (
      <div className="min-h-full p-4 sm:p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8 text-cyan-400" />
            <Skeleton className="h-12 w-72" dark={dark} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" dark={dark} />
            <Skeleton className="h-32 w-full" dark={dark} />
            <Skeleton className="h-32 w-full" dark={dark} />
          </div>

          <Skeleton className="h-72 w-full" dark={dark} />
          <Skeleton className="h-72 w-full" dark={dark} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-4 sm:p-6 md:p-10 ${pageWrap}`}>
      <ConfirmDialog
        open={showLogoutAfterChange}
        title="Logout"
        message="Your password has been changed successfully. For security, it is recommended to logout and sign in again."
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
        oneButton
        variant="warning"
        onConfirm={() => setShowChangeFailed(false)}
      />

      <ConfirmDialog
        open={showAdminConfirmReset}
        title="Reset Password"
        message={`Are you sure you want to reset password for: ${targetEmail
          .trim()
          .toLowerCase()}?`}
        confirmText={resetting ? "Resetting..." : "Reset Password"}
        cancelText="Cancel"
        danger
        loading={resetting}
        onConfirm={doAdminReset}
        onCancel={() => setShowAdminConfirmReset(false)}
      />

      <ConfirmDialog
        open={showAdminResult}
        title="Admin Result"
        message={adminResultMsg}
        confirmText="OK"
        oneButton
        variant="info"
        onConfirm={() => setShowAdminResult(false)}
      />

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon
              className={`w-8 h-8 ${
                dark ? "text-[#8EB69B]" : "text-[#235347]"
              }`}
            />
            <h1 className={`text-3xl md:text-4xl font-bold ${heading}`}>
              Security Settings
            </h1>
          </div>
          <p className={`mt-3 text-sm ${muted}`}>
            Signed in as{" "}
            <span
              className={dark ? "font-medium text-white" : "font-medium text-slate-900"}
            >
              {user.name}
            </span>{" "}
            <span className={muted}>({user.role})</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <SecurityStatCard
            title="Account Role"
            value={String(user.role || "").toUpperCase()}
            subtitle="Current access level in the repository."
            tone="cyan"
            dark={dark}
          />
          <SecurityStatCard
            title="Password Policy"
            value="8+ chars"
            subtitle="Use strong passwords with mixed character types."
            tone="emerald"
            dark={dark}
          />
          <SecurityStatCard
            title="Theme Mode"
            value={themeLabel}
            subtitle="Applies across the protected workspace."
            tone="violet"
            dark={dark}
          />
          <SecurityStatCard
            title="Admin Tools"
            value={adminToolsLabel}
            subtitle="Reset and advanced controls depend on your role."
            tone="amber"
            dark={dark}
          />
        </div>

        <div className={`${ui.shell} p-4 mb-6`}>
          <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabButton
              active={activeTab === "security"}
              label="Security"
              icon={<KeyIcon className="w-5 h-5" />}
              onClick={() => setActiveTab("security")}
              dark={dark}
            />
            <TabButton
              active={activeTab === "appearance"}
              label="Appearance"
              icon={<PaintBrushIcon className="w-5 h-5" />}
              onClick={() => setActiveTab("appearance")}
              dark={dark}
            />
            <TabButton
              active={activeTab === "account"}
              label="Account"
              icon={<UserIcon className="w-5 h-5" />}
              onClick={() => setActiveTab("account")}
              dark={dark}
            />
          </div>
        </div>

        {activeTab === "security" && (
          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
            <div className="space-y-6">
              <div className={`${cardCls} relative overflow-hidden rounded-3xl p-4 sm:p-6`}>
                <div className={`absolute inset-x-0 top-0 h-1.5 ${dark ? "bg-[#7c8798]/45" : "bg-[#a7b0bd]/65"}`} />
                <div className="flex items-start gap-3">
                  <div
                    className={`h-12 w-12 rounded-2xl grid place-items-center ${
                      dark
                        ? "bg-white/[0.06] border border-white/10 text-[#b8c4d6]"
                        : "bg-[#eff3f7] border border-white/60 text-[#5d6c80]"
                    }`}
                  >
                    <KeyIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2
                      className={`text-xl md:text-2xl font-semibold ${
                        dark ? "text-emerald-200" : "text-emerald-700"
                      }`}
                    >
                      Change Password
                    </h2>
                    <p className={`mt-1 text-sm ${muted}`}>
                      Enter your current password and a new secure password.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <div>
                    <label
                      className={`block text-[11px] font-semibold mb-2 ${heading}`}
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        type={showCurrent ? "text" : "password"}
                        placeholder="Enter current password"
                        disabled={saving}
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((v) => !v)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                          dark
                            ? "text-cyan-100/60 hover:text-white"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {showCurrent ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-[11px] font-semibold mb-2 ${heading}`}
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        type={showNew ? "text" : "password"}
                        placeholder="Enter new password"
                        disabled={saving}
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                          dark
                            ? "text-cyan-100/60 hover:text-white"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {showNew ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className={`mb-2 text-[11px] font-semibold ${muted}`}>
                        {passwordStrengthLabel}
                      </div>
                      <div
                        className={`h-2 w-full rounded-full overflow-hidden ${
                          dark ? "bg-white/10" : "bg-slate-200"
                        }`}
                      >
                        <div
                          className={`h-full transition-all duration-300 ${strengthBarCls}`}
                          style={{ width: `${passwordStrength * 25}%` }}
                        />
                      </div>
                    </div>

                    <div
                      className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                        dark
                          ? "border-cyan-300/10 bg-white/[0.03] text-cyan-100/70"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      Password must be at least 8 characters and should include
                      uppercase letters, numbers, and symbols.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={changeMyPassword}
                    disabled={saving}
                    className={`mt-2 w-full sm:w-auto min-h-11 px-4 py-3 rounded-2xl font-semibold transition disabled:opacity-70 ${
                      dark
                        ? "bg-[#8EB69B] hover:bg-[#9ec3a9] text-[#051F20] shadow-[0_10px_24px_rgba(142,182,155,0.20)]"
                        : "bg-[#235347] hover:bg-[#163832] text-white shadow-[0_10px_22px_rgba(35,83,71,0.16)]"
                    }`}
                  >
                    {saving ? "Saving..." : "Save Password"}
                  </button>
                </div>
              </div>

              {canAdminReset && (
                <div className={`${cardCls} rounded-3xl p-4 sm:p-6`}>
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-12 w-12 rounded-2xl grid place-items-center ${
                        dark
                          ? "bg-violet-500/12 border border-violet-300/15 text-violet-200"
                          : "bg-violet-50 border border-violet-200 text-violet-700"
                      }`}
                    >
                      <ShieldCheckIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2
                        className={`text-xl md:text-2xl font-semibold ${
                          dark ? "text-violet-200" : "text-violet-700"
                        }`}
                      >
                        Admin Reset Password
                      </h2>
                      <p className={`mt-1 text-sm ${muted}`}>
                        Reset a user password directly from the admin panel.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-5 rounded-2xl border p-4 ${
                      dark
                        ? "border-amber-300/15 bg-amber-400/8"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div
                      className={`flex items-start gap-2 ${
                        dark ? "text-amber-200" : "text-amber-700"
                      }`}
                    >
                      <ExclamationTriangleIcon className="w-5 h-5 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">
                          Use only for verified requests
                        </div>
                        <div
                          className={`mt-1 text-sm ${
                            dark ? "text-amber-100/80" : "text-amber-700/90"
                          }`}
                        >
                          Confirm the user identity before performing an admin
                          password reset.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    <div>
                      <label
                        className={`block text-[11px] font-semibold mb-2 ${heading}`}
                      >
                        User Email
                      </label>
                      <input
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        type="email"
                        placeholder="e.g. staff@email.com"
                        disabled={resetting}
                        className={inputCls.replace("pr-12", "pr-4")}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-[11px] font-semibold mb-2 ${heading}`}
                      >
                        New Password for User
                      </label>
                      <div className="relative">
                        <input
                          value={adminNewPassword}
                          onChange={(e) => setAdminNewPassword(e.target.value)}
                          type={showAdminNew ? "text" : "password"}
                          placeholder="Enter new password for this user"
                          disabled={resetting}
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminNew((v) => !v)}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                            dark
                              ? "text-cyan-100/60 hover:text-white"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {showAdminNew ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        dark
                          ? "border-cyan-300/10 bg-white/[0.03] text-cyan-100/70"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      Target account:{" "}
                      <span
                        className={
                          dark
                            ? "font-medium text-white"
                            : "font-medium text-slate-900"
                        }
                      >
                        {targetEmail.trim() || "—"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={openAdminResetDialog}
                      disabled={resetting}
                      className={`mt-2 w-full sm:w-auto min-h-11 px-4 py-3 rounded-2xl font-semibold transition disabled:opacity-70 ${ui.buttonPrimary}`}
                    >
                      {resetting ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className={`${cardCls} relative overflow-hidden rounded-3xl p-4 sm:p-6`}>
                <div className={`absolute inset-x-0 top-0 h-1.5 ${dark ? "bg-[#8EB69B]/55" : "bg-[#8EB69B]/70"}`} />
                <div className="flex items-start gap-3">
                  <div
                    className={`h-12 w-12 rounded-2xl grid place-items-center ${
                      dark
                        ? "bg-[#8EB69B]/10 border border-[#8EB69B]/18 text-[#DAF1DE]"
                        : "bg-[#edf6f0] border border-white/60 text-[#235347]"
                    }`}
                  >
                    <ExclamationTriangleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={`text-xl md:text-2xl font-semibold ${heading}`}>
                      Security Notes
                    </h2>
                    <p className={`mt-1 text-sm ${muted}`}>
                      Best practices for repository access and account protection.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className={previewCardCls}>
                    <div className={`font-medium ${heading}`}>
                      Use strong passwords
                    </div>
                    <div className={`mt-1 text-sm ${muted}`}>
                      Combine uppercase, lowercase, numbers, and symbols.
                    </div>
                  </div>

                  <div className={previewCardCls}>
                    <div className={`font-medium ${heading}`}>
                      Reset only when needed
                    </div>
                    <div className={`mt-1 text-sm ${muted}`}>
                      Admin resets should be done carefully and only for verified
                      user requests.
                    </div>
                  </div>

                  <div className={previewCardCls}>
                    <div className={`font-medium ${heading}`}>
                      Logout after critical changes
                    </div>
                    <div className={`mt-1 text-sm ${muted}`}>
                      Re-login after password changes to refresh the secured
                      session.
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${cardCls} relative overflow-hidden rounded-3xl p-4 sm:p-6`}>
                <div className={`absolute inset-x-0 top-0 h-1.5 ${dark ? "bg-[#d7aa6b]/55" : "bg-[#ddb16f]/70"}`} />
                <div className="flex items-start gap-3">
                  <div
                    className={`h-12 w-12 rounded-2xl grid place-items-center ${
                      dark
                        ? "bg-emerald-400/12 border border-emerald-300/15 text-emerald-200"
                        : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    }`}
                  >
                    <LockClosedIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={`text-xl md:text-2xl font-semibold ${heading}`}>
                      Security Checklist
                    </h2>
                    <p className={`mt-1 text-sm ${muted}`}>
                      Quick review of account protection basics.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <ChecklistItem
                    label="Authenticated session active"
                    ok={true}
                    dark={dark}
                  />
                  <ChecklistItem
                    label="Password policy visible"
                    ok={true}
                    dark={dark}
                  />
                  <ChecklistItem
                    label="Theme preference saved"
                    ok={true}
                    dark={dark}
                  />
                  <ChecklistItem
                    label="Admin reset tools protected by role"
                    ok={canAdminReset}
                    dark={dark}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
            <div className={`${cardCls} rounded-3xl p-4 sm:p-6`}>
              <div className="flex items-start gap-3">
                <div
                  className={`h-12 w-12 rounded-2xl grid place-items-center ${
                    dark
                      ? "bg-cyan-400/12 border border-cyan-300/15 text-cyan-100"
                      : "bg-cyan-50 border border-cyan-200 text-cyan-700"
                  }`}
                >
                  <PaintBrushIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-xl md:text-2xl font-semibold ${heading}`}>
                    Page Theme
                  </h2>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Choose the protected workspace theme and save it for future visits.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`rounded-3xl border p-5 text-left transition ${
                    pageTheme === "dark"
                      ? dark
                        ? "border-cyan-300/30 bg-cyan-400/10"
                        : "border-cyan-400 bg-cyan-50"
                      : dark
                      ? "border-cyan-300/12 bg-white/[0.04]"
                      : "border-slate-300 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <MoonIcon
                      className={`w-7 h-7 ${
                        dark ? "text-cyan-200" : "text-slate-700"
                      }`}
                    />
                    {pageTheme === "dark" && (
                      <CheckCircleIcon
                        className={`w-5 h-5 ${
                          dark ? "text-cyan-200" : "text-cyan-600"
                        }`}
                      />
                    )}
                  </div>
                  <div
                    className={`mt-4 text-lg font-semibold ${
                      dark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Dark Mode
                  </div>
                  <div
                    className={`mt-1 text-sm ${
                      dark ? "text-cyan-100/65" : "text-slate-600"
                    }`}
                  >
                    Deep slate surfaces with a premium internal dashboard feel.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`rounded-3xl border p-5 text-left transition ${
                    pageTheme === "light"
                      ? dark
                        ? "border-cyan-300/30 bg-cyan-400/10"
                        : "border-cyan-400 bg-cyan-50"
                      : dark
                      ? "border-cyan-300/12 bg-white/[0.04]"
                      : "border-slate-300 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <SunIcon
                      className={`w-7 h-7 ${
                        dark ? "text-cyan-200" : "text-amber-500"
                      }`}
                    />
                    {pageTheme === "light" && (
                      <CheckCircleIcon
                        className={`w-5 h-5 ${
                          dark ? "text-cyan-200" : "text-cyan-600"
                        }`}
                      />
                    )}
                  </div>
                  <div
                    className={`mt-4 text-lg font-semibold ${
                      dark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Light Mode
                  </div>
                  <div
                    className={`mt-1 text-sm ${
                      dark ? "text-cyan-100/65" : "text-slate-600"
                    }`}
                  >
                    A clean light workspace with strong contrast and softer surfaces.
                  </div>
                </button>
              </div>

              <div
                className={`mt-5 rounded-2xl border p-4 ${
                  dark
                    ? "border-cyan-300/12 bg-white/[0.04]"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className={`text-sm font-medium ${heading}`}>
                  Current page theme
                </div>
                <div className={`mt-1 text-sm ${muted}`}>{themeLabel}</div>
              </div>
            </div>

            <div className={`${cardCls} rounded-3xl p-4 sm:p-6`}>
              <div className="flex items-start gap-3">
                <div
                  className={`h-12 w-12 rounded-2xl grid place-items-center ${
                    dark
                      ? "bg-cyan-400/12 border border-cyan-300/15 text-cyan-100"
                      : "bg-cyan-50 border border-cyan-200 text-cyan-700"
                  }`}
                >
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-xl md:text-2xl font-semibold ${heading}`}>
                    Interface Preview
                  </h2>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Quick preview of the current page style.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div
                  className={`rounded-3xl p-5 border ${
                    pageTheme === "dark"
                      ? "border-cyan-300/12 bg-[#081522]"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${
                      pageTheme === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Sample Header
                  </div>
                  <div
                    className={`mt-2 text-xs ${
                      pageTheme === "dark"
                        ? "text-cyan-100/65"
                        : "text-slate-600"
                    }`}
                  >
                    This shows how text looks in the selected page theme.
                  </div>
                </div>

                <div
                  className={`rounded-3xl p-5 border ${
                    pageTheme === "dark"
                      ? "border-cyan-300/12 bg-white/[0.04]"
                      : "border-slate-300 bg-slate-50"
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${
                      pageTheme === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Sample Card
                  </div>
                  <div
                    className={`mt-2 text-xs ${
                      pageTheme === "dark"
                        ? "text-cyan-100/65"
                        : "text-slate-600"
                    }`}
                  >
                    Cards stay readable and polished in both modes.
                  </div>
                </div>

                <div
                  className={`rounded-3xl p-5 border ${
                    pageTheme === "dark"
                      ? "border-cyan-300/12 bg-white/[0.04]"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
                      pageTheme === "dark"
                        ? "text-cyan-100/55"
                        : "text-slate-500"
                    }`}
                  >
                    Sample Form
                  </div>
                  <div
                    className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                      pageTheme === "dark"
                        ? "border-cyan-300/10 bg-[#081522] text-white"
                        : "border-slate-300 bg-slate-50 text-slate-900"
                    }`}
                  >
                    Example input appearance
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "account" && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
            <div className={`${cardCls} rounded-3xl p-4 sm:p-6`}>
              <div className="flex items-start gap-3">
                <div
                  className={`h-12 w-12 rounded-2xl grid place-items-center ${
                    dark
                      ? "bg-cyan-400/12 border border-cyan-300/15 text-cyan-100"
                      : "bg-cyan-50 border border-cyan-200 text-cyan-700"
                  }`}
                >
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-xl md:text-2xl font-semibold ${heading}`}>
                    Account Summary
                  </h2>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Current signed-in account details.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className={previewCardCls}>
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${muted}`}
                  >
                    Name
                  </div>
                  <div className={`mt-2 text-sm font-medium ${heading}`}>
                    {user.name}
                  </div>
                </div>

                <div className={previewCardCls}>
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${muted}`}
                  >
                    Role
                  </div>
                  <div className={`mt-2 text-sm font-medium ${heading}`}>
                    {user.role}
                  </div>
                </div>

                <div className={previewCardCls}>
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${muted}`}
                  >
                    Theme
                  </div>
                  <div className={`mt-2 text-sm font-medium ${heading}`}>
                    {themeLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${cardCls} rounded-3xl p-4 sm:p-6`}>
              <div className="flex items-start gap-3">
                <div
                  className={`h-12 w-12 rounded-2xl grid place-items-center ${
                    dark
                      ? "bg-emerald-400/12 border border-emerald-300/15 text-emerald-200"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  }`}
                >
                  <LockClosedIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-xl md:text-2xl font-semibold ${heading}`}>
                    Security Checklist
                  </h2>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Quick review of account protection basics.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <ChecklistItem
                  label="Authenticated session active"
                  ok={true}
                  dark={dark}
                />
                <ChecklistItem
                  label="Password policy visible"
                  ok={true}
                  dark={dark}
                />
                <ChecklistItem
                  label="Theme preference saved"
                  ok={true}
                  dark={dark}
                />
                <ChecklistItem
                  label="Admin reset tools protected by role"
                  ok={canAdminReset}
                  dark={dark}
                />
              </div>
            </div>
          </div>
        )}

        <div className={`mt-8 text-xs ${muted}`}>
          Tip: The protected theme is saved on this browser and applied across the internal workspace.
        </div>
      </div>
    </div>
  );
}
