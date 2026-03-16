"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

        <div className={styles.brandBlock}>
          <h2 className={styles.brandSubTitle}>
            Protected Area Management Office
          </h2>

          <h1 className={styles.brandMain}>
            Mt. Hamiguitan Range Wildlife Sanctuary
          </h1>
        </div>

        <div className={styles.formBlock}>
          <label className={styles.fieldLabel}>Email Address</label>
          <div className={styles.inputShell}>
            <span className={styles.inputIcon}>✉</span>
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
            <span className={styles.inputIcon}>🔒</span>
            <input
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter your password..."
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) handleLogin();
              }}
            />
          </div>

          <div className={styles.rowMeta}>
            <Link href="/forgot-password" className={styles.forgotLink}>
              Forgot Password?
            </Link>
          </div>

          <button
            type="button"
            className={`${styles.button} app-primary-button`}
            disabled={loading || leaving}
            onClick={handleLogin}
          >
            <span>{loading ? "Signing In..." : "Sign In"}</span>
            <span className={styles.buttonArrow}>→</span>
          </button>

          <div className={styles.bottomText}>
            <span>Don’t have an account?</span>
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
