"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import styles from "./forgot-password.module.css";

function Spinner() {
  return (
    <svg
      className={styles.spin}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

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

  const sendCode = async () => {
    if (!email.trim()) {
      openMsg("Required field", "Please enter your email address.", true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        openMsg("Request failed", data?.error || "Failed to send verification code.", true);
        return;
      }

      setStep("code");
      openMsg(
        "Code Sent",
        "If the email exists, a verification code has been sent. Please check your inbox or spam folder."
      );
    } catch {
      openMsg("Server Error", "Unable to connect to the server.", true);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      openMsg("Required field", "Please enter the verification code.", true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        openMsg("Verification failed", data?.error || "Invalid verification code.", true);
        return;
      }

      router.push(`/reset-password?token=${encodeURIComponent(data.token)}`);
    } catch {
      openMsg("Server Error", "Unable to connect to the server.", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrap}>
      <ConfirmDialog
        open={showMsg}
        title={msgTitle}
        message={msgText}
        confirmText="OK"
        cancelText="Close"
        danger={msgDanger}
        loading={false}
        onConfirm={() => setShowMsg(false)}
        onCancel={() => setShowMsg(false)}
      />

      <div className={styles.bgImage} />
      <div className={styles.bgOverlay} />
      <div className={`${styles.bgGlow} ${styles.bgGlow1}`} />
      <div className={`${styles.bgGlow} ${styles.bgGlow2}`} />

      <section className={styles.card}>
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
          <p className={styles.brandReset}>
            {step === "email" ? "Forgot Password" : "Enter Verification Code"}
          </p>
        </div>

        <div className={styles.formBlock}>
          {step === "email" ? (
            <>
              <label className={styles.fieldLabel}>Email Address</label>
              <div className={styles.inputShell}>
                <span className={styles.inputIcon}>✉</span>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Enter your registered email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) sendCode();
                  }}
                />
              </div>

              <button
                type="button"
                className={`${styles.button} app-primary-button`}
                disabled={loading}
                onClick={sendCode}
              >
                {loading && <Spinner />}
                <span>{loading ? "Sending..." : "Send Verification Code"}</span>
              </button>

              <div className={styles.bottomText}>
                <span>Remembered your password?</span>
                <button
                  type="button"
                  className={styles.inlineLogin}
                  onClick={() => router.push("/login")}
                  disabled={loading}
                >
                  Sign In
                </button>
              </div>
            </>
          ) : (
            <>
              <label className={styles.fieldLabel}>Verification Code</label>
              <div className={styles.inputShell}>
                <span className={styles.inputIcon}>#</span>
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code..."
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) verifyCode();
                  }}
                />
              </div>

              <p className={styles.tip}>
                We sent a verification code to <strong>{email}</strong>
              </p>

              <button
                type="button"
                className={`${styles.button} app-primary-button`}
                disabled={loading}
                onClick={verifyCode}
              >
                {loading && <Spinner />}
                <span>{loading ? "Verifying..." : "Verify Code"}</span>
              </button>

              <div className={styles.bottomActions}>
                <button
                  type="button"
                  className={styles.secondaryLink}
                  onClick={() => {
                    setStep("email");
                    setCode("");
                  }}
                  disabled={loading}
                >
                  ← Go Back
                </button>

                <button
                  type="button"
                  className={styles.inlineLogin}
                  onClick={() => router.push("/login")}
                  disabled={loading}
                >
                  Sign In
                </button>
              </div>
            </>
          )}

          <div className={styles.footerLine} />
          <p className={styles.footerNote}>Secure • Research • Innovation</p>
        </div>
      </section>
    </main>
  );
}
