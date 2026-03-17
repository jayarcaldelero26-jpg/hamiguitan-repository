"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import styles from "./login.module.css";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={styles.actionIcon}
      >
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
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
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

export default function LoginPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("Login failed.");

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("Login successful.");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/me", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!active) return;
        if (res.ok) {
          window.location.replace("/dashboard");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const goRegister = () => {
    if (loading || leaving) return;
    setLeaving(true);
    setTimeout(() => {
      router.push("/register");
    }, 250);
  };

  const handleLogin = async () => {
    if (loading) return;

    setLoading(true);

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
        setShowError(true);
        return;
      }

      setSuccessMsg("Login successful. Welcome back.");
      setShowSuccess(true);
    } catch {
      setErrorMsg("Server unreachable. Check internet or server.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || checkingSession) {
    return <div className={styles.loadingScreen}>Loading...</div>;
  }

  return (
    <main className={styles.wrap}>
      <ConfirmDialog
        open={showError}
        title="Login Failed"
        message={errorMsg}
        confirmText="OK"
        oneButton
        variant="warning"
        onConfirm={() => setShowError(false)}
      />

      <ConfirmDialog
        open={showSuccess}
        title="Welcome Back"
        message={successMsg}
        confirmText="Go to Dashboard"
        oneButton
        variant="success"
        onConfirm={() => {
          setShowSuccess(false);
          window.location.assign("/dashboard");
        }}
      />

      <div className={styles.bgImage} />
      <div className={styles.bgOverlay} />
      <div className={`${styles.bgGlow} ${styles.bgGlow1}`} />
      <div className={`${styles.bgGlow} ${styles.bgGlow2}`} />

      <section
        className={`${styles.card} ${
          leaving ? styles.cardExit : styles.cardEnter
        }`}
      >
        <div className={styles.topBar}>
          <Link href="/" className={styles.backHome}>
            {"<-"} Back to Home
          </Link>
        </div>

        <div className={styles.logoRow}>
          <div className={styles.logoItemSmall}>
            <Image
              src="/images/branding/denr-logo.png"
              alt="DENR Logo"
              width={92}
              height={92}
              className={styles.logoSmall}
              priority
            />
          </div>

          <div className={styles.logoItemSmall}>
            <Image
              src="/images/branding/asean-logo.png"
              alt="ASEAN Logo"
              width={92}
              height={92}
              className={styles.logoSmall}
              priority
            />
          </div>

          <div className={styles.logoItemCenter}>
            <Image
              src="/images/branding/mhrws-logo.png"
              alt="MHRWS Logo"
              width={126}
              height={126}
              className={styles.logoCenter}
              priority
            />
          </div>

          <div className={styles.logoItemSmall}>
            <Image
              src="/images/branding/unesco-logo.png"
              alt="UNESCO Logo"
              width={92}
              height={92}
              className={styles.logoSmall}
              priority
            />
          </div>
        </div>

        <Link href="/" className={styles.brandLink}>
          <div className={styles.brandBlock}>
            <h2 className={styles.brandSubTitle}>
              Protected Area Management Office
            </h2>

            <h1 className={styles.brandMain}>
              Mt. Hamiguitan Range Wildlife Sanctuary
            </h1>
          </div>
        </Link>

        <div className={styles.formBlock}>
          <label className={styles.fieldLabel}>Email Address</label>
          <div className={styles.inputShell}>
            <span className={styles.inputIcon}>@</span>
            <input
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email..."
              autoComplete="email"
            />
          </div>

          <label className={styles.fieldLabel}>Password</label>
          <div className={styles.inputShell}>
            <span className={styles.inputIcon}>*</span>
            <input
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password..."
              autoComplete="current-password"
              onBlur={() => setCapsLockOn(false)}
              onKeyDown={(e) => {
                setCapsLockOn(e.getModifierState("CapsLock"));
                if (e.key === "Enter" && !loading) handleLogin();
              }}
              onKeyUp={(e) => {
                setCapsLockOn(e.getModifierState("CapsLock"));
              }}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              disabled={loading}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          {capsLockOn && (
            <div className={styles.capsLockNotice}>
              <CapsLockIcon />
              <span>Caps Lock is on</span>
            </div>
          )}

          <div className={styles.rowMeta}>
            <Link href="/forgot-password" className={styles.forgotLink}>
              Forgot Password?
            </Link>
          </div>

          <button
            type="button"
            className={styles.button}
            disabled={loading || leaving}
            onClick={handleLogin}
          >
            <span>{loading ? "Signing In..." : "Sign In"}</span>
            <span className={styles.buttonArrow}>{">"}</span>
          </button>

          <div className={styles.bottomText}>
            <span>Don&apos;t have an account?</span>
            <button
              type="button"
              className={styles.inlineRegister}
              onClick={goRegister}
              disabled={loading || leaving}
            >
              Create Account
            </button>
          </div>

          <div className={styles.footerLine} />

          <p className={styles.footerNote}>Secure • Research • Innovation</p>
        </div>
      </section>
    </main>
  );
}
