"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import styles from "./register.module.css";

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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

function makeUserCode() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `MHRWS-${y}${m}${day}-${rand}`;
}

export default function RegisterPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [showMsg, setShowMsg] = useState(false);
  const [msgTitle, setMsgTitle] = useState("Notice");
  const [msgText, setMsgText] = useState("");
  const [msgDanger, setMsgDanger] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("None");
  const [birthdate, setBirthdate] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [contact, setContact] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("Mount Hamiguitan Range Wildlife Sanctuary");
  const [employmentType, setEmploymentType] = useState("");

  const emailLower = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (!firstName.trim() || !lastName.trim()) {
      openMsg("Required fields", "Please fill First Name and Last Name.", true);
      return;
    }
    if (!birthdate) {
      openMsg("Required field", "Birthdate is required.", true);
      return;
    }
    if (!emailLower) {
      openMsg("Required field", "Email is required.", true);
      return;
    }
    if (!isValidEmail(emailLower)) {
      openMsg("Invalid email", "Please enter a valid email address.", true);
      return;
    }
    if (!password) {
      openMsg("Required field", "Password is required.", true);
      return;
    }
    if (password.length < 8) {
      openMsg("Weak password", "Password must be at least 8 characters.", true);
      return;
    }
    if (!employmentType) {
      openMsg("Required field", "Promotion/Employment Type is required.", true);
      return;
    }

    setLoading(true);
    try {
      const userCode = makeUserCode();

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userCode,
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          suffix,
          birthdate,
          employmentType,
          email: emailLower,
          password,
          contact: contact.trim(),
          position: position.trim(),
          department: department.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        openMsg("Registration failed", data?.error || "Registration failed.", true);
        return;
      }

      openMsg("Success", `Registered! Your User ID is: ${userCode}\nYou can login now.`);
    } catch {
      openMsg("Registration failed", "Server unreachable. Please run dev server / check internet.", true);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div className={styles.loadingScreen}>Loading...</div>;
  }

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
        <div className={styles.cardTop}>
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

            <p className={styles.brandRegister}>Create Account</p>
          </div>
        </div>

        <div className={styles.formBlock}>
          <div className={styles.formScroll}>
            <div className={styles.rowTwo}>
              <div>
                <label className={styles.fieldLabel}>
                  First Name <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputShell}>
                  <input
                    className={styles.input}
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={styles.fieldLabel}>Middle Name</label>
                <div className={styles.inputShell}>
                  <input
                    className={styles.input}
                    placeholder="Middle name"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.rowTwo}>
              <div>
                <label className={styles.fieldLabel}>
                  Last Name <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputShell}>
                  <input
                    className={styles.input}
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={styles.fieldLabel}>Suffix</label>
                <div className={styles.inputShell}>
                  <select
                    className={styles.select}
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                  >
                    <option>None</option>
                    <option>Jr</option>
                    <option>Sr</option>
                    <option>II</option>
                    <option>III</option>
                  </select>
                </div>
              </div>
            </div>

            <label className={styles.fieldLabel}>
              Birthdate <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputShell}>
              <input
                className={styles.input}
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
            </div>

            <label className={styles.fieldLabel}>
              Email Address <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputShell}>
              <span className={styles.inputIcon}>✉</span>
              <input
                className={styles.input}
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmail((v) => v.trim().toLowerCase())}
                type="email"
                inputMode="email"
              />
            </div>
            {email.trim() && !isValidEmail(emailLower) && (
              <div className={styles.errorText}>Please enter a valid email.</div>
            )}

            <label className={styles.fieldLabel}>
              Password <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputShell}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                className={styles.input}
                placeholder="Create password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className={styles.eyeBtn}
                aria-label={showPass ? "Hide password" : "Show password"}
                title={showPass ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
            <p className={styles.tip}>Tip: use letters + numbers. Minimum 8 characters.</p>

            <div className={styles.empBox}>
              <div className={styles.empTitle}>
                Promotion/Employment Type <span className={styles.required}>*</span>
              </div>

              <div className={styles.empGrid}>
                {["Job Order", "Contract of Service", "Casual", "Permanent"].map((opt) => (
                  <label
                    key={opt}
                    className={`${styles.empOpt} ${
                      employmentType === opt ? styles.empOptActive : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="employmentType"
                      value={opt}
                      checked={employmentType === opt}
                      onChange={() => setEmploymentType(opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.rowTwo}>
              <div>
                <label className={styles.fieldLabel}>Contact No.</label>
                <div className={styles.inputShell}>
                  <input
                    className={styles.input}
                    placeholder="09xxxxxxxxxx"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={styles.fieldLabel}>Position</label>
                <div className={styles.inputShell}>
                  <input
                    className={styles.input}
                    placeholder="e.g. PAMO Staff / Ranger"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <label className={styles.fieldLabel}>Department</label>
            <div className={styles.inputShell}>
              <input
                className={styles.input}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={loading || leaving}
              className={`${styles.button} app-primary-button`}
            >
              {loading && <Spinner />}
              <span>{loading ? "Registering..." : "Create Account"}</span>
              {!loading && <span className={styles.buttonArrow}>→</span>}
            </button>

            <div className={styles.bottomText}>
              <span>Already have an account?</span>
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

            <p className={styles.footerNote}>
              Fields with <span className={styles.required}>*</span> are required.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
