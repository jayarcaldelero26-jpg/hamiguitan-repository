"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import styles from "./reset-password.module.css";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.9 5.08A10.9 10.9 0 0112 5c6 0 10 7 10 7a18.5 18.5 0 01-3.2 4.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.7 6.7C3.6 8.9 2 12 2 12s4 7 10 7c1 0 1.95-.2 2.83-.55"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className={styles.spin} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 00-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  );
}

export default function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();

  const token = useMemo(() => params.get("token") || "", [params]);

  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [showMsg, setShowMsg] = useState(false);
  const [msgTitle, setMsgTitle] = useState("Notice");
  const [msgText, setMsgText] = useState("");
  const [msgDanger, setMsgDanger] = useState(false);

  const openMsg = (title: string, message: string, danger = false) => {
    setMsgTitle(title);
    setMsgText(message);
    setMsgDanger(danger);
    setShowMsg(true);
  };

  const goLogin = () => {
    if (loading || leaving) return;
    setLeaving(true);
    setTimeout(() => {
      router.push("/login");
    }, 250);
  };

  const submit = async () => {
    if (!token) {
      openMsg("Invalid link", "Missing reset token. Please request a new reset link.", true);
      return;
    }

    if (!password) {
      openMsg("Required field", "New password is required.", true);
      return;
    }

    if (password.length < 8) {
      openMsg("Weak password", "Password must be at least 8 characters.", true);
      return;
    }

    if (!confirmPassword) {
      openMsg("Required field", "Please confirm your new password.", true);
      return;
    }

    if (password !== confirmPassword) {
      openMsg("Password mismatch", "Passwords do not match.", true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        openMsg("Reset failed", data?.error || "Failed to reset password.", true);
        return;
      }

      openMsg("Success", "Your password has been updated. You can now sign in.");
    } catch {
      openMsg("Reset failed", "Server unreachable. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrap}>
      <style jsx global>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        input[type="password"]::-webkit-credentials-auto-fill-button,
        input[type="password"]::-webkit-contacts-auto-fill-button {
          visibility: hidden;
          display: none;
        }
      `}</style>

      <ConfirmDialog
        open={showMsg}
        title={msgTitle}
        message={msgText}
        confirmText="OK"
        cancelText="Close"
        danger={msgDanger}
        loading={false}
        onConfirm={() => {
          setShowMsg(false);
          if (msgTitle === "Success") router.push("/login");
        }}
        onCancel={() => setShowMsg(false)}
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

          <p className={styles.brandReset}>Create New Password</p>
        </div>

        <div className={styles.formBlock}>
          <label className={styles.fieldLabel}>
            New Password <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputShell}>
            <span className={styles.inputIcon}>🔒</span>
            <input
              className={styles.input}
              placeholder="Enter new password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPass1 ? "text" : "password"}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPass1((s) => !s)}
              className={styles.eyeBtn}
              aria-label={showPass1 ? "Hide password" : "Show password"}
              title={showPass1 ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPass1} />
            </button>
          </div>
          <p className={styles.tip}>Tip: use letters + numbers. Minimum 8 characters.</p>

          <label className={styles.fieldLabel}>
            Confirm New Password <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputShell}>
            <span className={styles.inputIcon}>🔒</span>
            <input
              className={styles.input}
              placeholder="Confirm new password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showPass2 ? "text" : "password"}
              autoComplete="new-password"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) submit();
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass2((s) => !s)}
              className={styles.eyeBtn}
              aria-label={showPass2 ? "Hide password" : "Show password"}
              title={showPass2 ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPass2} />
            </button>
          </div>

          {confirmPassword && password !== confirmPassword && (
            <div className={styles.errorText}>Passwords do not match.</div>
          )}

          <button
            type="button"
            className={styles.button}
            disabled={loading || leaving}
            onClick={submit}
          >
            {loading && <Spinner />}
            <span>{loading ? "Updating..." : "Update Password"}</span>
            {!loading && <span className={styles.buttonArrow}>→</span>}
          </button>

          <div className={styles.bottomText}>
            <span>Remembered your password?</span>
            <button
              type="button"
              className={styles.inlineLogin}
              onClick={goLogin}
              disabled={loading || leaving}
            >
              Sign In
            </button>
          </div>

          <div className={styles.footerLine} />
          <p className={styles.footerNote}>Secure • Research • Innovation</p>
        </div>
      </section>
    </main>
  );
}