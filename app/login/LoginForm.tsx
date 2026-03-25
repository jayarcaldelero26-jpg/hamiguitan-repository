"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearBrowserTabDenied, markBrowserSessionActive } from "@/app/lib/authSession";
import styles from "./login.module.css";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.actionIcon}>
        <path
          d="M3 3l18 18M10.58 10.59A2 2 0 0013.41 13.4M9.88 5.09A10.94 10.94 0 0112 4.91c5.05 0 8.27 3.11 9.5 7.09a11.63 11.63 0 01-3.02 4.6M6.53 6.52A11.64 11.64 0 002.5 12c.68 2.18 1.98 4.08 3.83 5.44A10.7 10.7 0 0012 19.09c1.34 0 2.6-.23 3.77-.64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.actionIcon}>
      <path
        d="M2.5 12C3.73 8.02 6.95 4.91 12 4.91S20.27 8.02 21.5 12c-1.23 3.98-4.45 7.09-9.5 7.09S3.73 15.98 2.5 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CapsLockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.noticeIcon}>
      <path
        d="M12 3l6 7h-4v5H10v-5H6l6-7zm-4 14h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMsg(data?.error || "Invalid credentials.");
        return;
      }

      clearBrowserTabDenied();
      markBrowserSessionActive(Date.now(), { regenerateTabId: true });
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrorMsg("Server unreachable. Check internet or server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={styles.formBlock}
      onSubmit={(event) => {
        event.preventDefault();
        void handleLogin();
      }}
    >
      {errorMsg ? (
        <div className={styles.statusMessage} role="alert">
          {errorMsg}
        </div>
      ) : null}

      <label className={styles.fieldLabel} htmlFor="login-email">
        Email Address
      </label>
      <div className={styles.inputShell}>
        <span className={styles.inputIcon}>@</span>
        <input
          id="login-email"
          className={styles.input}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="Enter your email..."
          autoComplete="email"
        />
      </div>

      <label className={styles.fieldLabel} htmlFor="login-password">
        Password
      </label>
      <div className={styles.inputShell}>
        <span className={styles.inputIcon}>*</span>
        <input
          id="login-password"
          className={styles.input}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password..."
          autoComplete="current-password"
          onBlur={() => setCapsLockOn(false)}
          onKeyDown={(event) => {
            setCapsLockOn(event.getModifierState("CapsLock"));
          }}
          onKeyUp={(event) => {
            setCapsLockOn(event.getModifierState("CapsLock"));
          }}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={() => setShowPassword((value) => !value)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          disabled={loading}
        >
          <EyeIcon open={showPassword} />
        </button>
      </div>

      {capsLockOn ? (
        <div className={styles.capsLockNotice}>
          <CapsLockIcon />
          <span>Caps Lock is on</span>
        </div>
      ) : null}

      <div className={styles.rowMeta}>
        <Link href="/forgot-password" className={styles.forgotLink}>
          Forgot Password?
        </Link>
      </div>

      <button type="submit" className={styles.button} disabled={loading}>
        <span>{loading ? "Signing In..." : "Sign In"}</span>
        <span className={styles.buttonArrow}>{">"}</span>
      </button>

      <div className={styles.bottomText}>
        <span>Don&apos;t have an account?</span>
        <Link href="/register" className={styles.inlineRegister}>
          Create Account
        </Link>
      </div>

      <div className={styles.footerLine} />

      <p className={styles.footerNote}>Secure | Research | Innovation</p>
    </form>
  );
}
