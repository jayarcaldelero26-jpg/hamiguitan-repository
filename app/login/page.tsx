"use client";

import { useEffect, useState } from "react";
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
    }, 280);
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
    <div className={styles.wrap}>
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

      <div className={`${styles.bgGlow} ${styles.bgGlow1}`} />
      <div className={`${styles.bgGlow} ${styles.bgGlow2}`} />

      <div className={`${styles.card} ${leaving ? styles.cardExit : styles.cardEnter}`}>
        <div className={styles.formsLeft}>
          <div className={styles.panelLeft}>
            <h2 className={styles.heading}>Login</h2>

            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
            />

            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) handleLogin();
              }}
            />

            <button
              type="button"
              className={styles.button}
              disabled={loading || leaving}
              onClick={handleLogin}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </div>
        </div>

        <div className={styles.overlayRight}>
          <div className={styles.overlayInnerRight}>
            <h1 className={styles.title}>WELCOME BACK!</h1>
            <div className={styles.repoBox}>
              <h2 className={styles.repoTitle}>MHRWS Repository Documents</h2>

              <p className={styles.sub}>
                Mount Hamiguitan Range Wildlife Sanctuary
                <br />
                Secure access to research reports and official documents.
              </p>
            </div>
            <button
              type="button"
              className={styles.ghost}
              onClick={goRegister}
              disabled={loading || leaving}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}