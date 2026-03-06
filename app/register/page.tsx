"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";

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
    <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.95" />
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
    }, 280);
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

  return (
    <div className="page">
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

      <div className="orb orb1" />
      <div className="orb orb2" />

      <div className={`shell ${leaving ? "shellExit" : "shellEnter"}`}>
        <div className="leftPanel">
          <div className="leftInner">
            <h1>WELCOME BACK!</h1>
            <p>
              Hamiguitan Repository
              <br />
              Secure documents for Stakeholders and Academe Records.
            </p>

            <button onClick={goLogin} className="ghostBtn" disabled={loading || leaving}>
              Login
            </button>
          </div>
        </div>

        <div className="rightPanel">
          <h2>Register</h2>

          <div className="formGrid">
            <div className="row two">
              <div className="field">
                <label>
                  First Name <span>*</span>
                </label>
                <input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Middle Name</label>
                <input
                  placeholder="Middle name (optional)"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                />
              </div>
            </div>

            <div className="row two">
              <div className="field">
                <label>
                  Last Name <span>*</span>
                </label>
                <input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Suffix</label>
                <select value={suffix} onChange={(e) => setSuffix(e.target.value)}>
                  <option>None</option>
                  <option>Jr</option>
                  <option>Sr</option>
                  <option>II</option>
                  <option>III</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>
                Birthdate <span>*</span>
              </label>
              <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
            </div>

            <div className="field">
              <label>
                Email <span>*</span>
              </label>
              <input
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmail((v) => v.trim().toLowerCase())}
                type="email"
                inputMode="email"
              />
              {email.trim() && !isValidEmail(emailLower) && (
                <div className="errorText">Please enter a valid email.</div>
              )}
            </div>

            <div className="field">
              <label>
                Password <span>*</span>
              </label>

              <div className="passWrap">
                <input
                  placeholder="Create password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="eyeBtn"
                  aria-label={showPass ? "Hide password" : "Show password"}
                  title={showPass ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>

              <p className="tip">Tip: use letters + numbers. Minimum 8 characters.</p>
            </div>

            <div className="empBox">
              <div className="empTitle">
                Promotion/Employment Type <span>*</span>
              </div>

              <div className="empGrid">
                {["Job Order", "Contract of Service", "Casual", "Permanent"].map((opt) => (
                  <label key={opt} className={`empOpt ${employmentType === opt ? "active" : ""}`}>
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

            <div className="row two">
              <div className="field">
                <label>Contact No.</label>
                <input
                  placeholder="09xxxxxxxxxx"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Position</label>
                <input
                  placeholder="e.g. PAMO Staff / Ranger"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>Department</label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>

            <button onClick={submit} disabled={loading || leaving} className="submitBtn">
              {loading && <Spinner />}
              {loading ? "Registering..." : "Register"}
            </button>

            <p className="loginText">
              Already have an account?{" "}
              <button onClick={goLogin} className="inlineLink" type="button" disabled={loading || leaving}>
                Login
              </button>
            </p>

            <p className="reqText">
              Fields with <span>*</span> are required.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at top left, rgba(0, 255, 255, 0.08), transparent 26%),
            radial-gradient(circle at bottom right, rgba(0, 149, 255, 0.08), transparent 30%),
            linear-gradient(135deg, #02040a 0%, #08111d 45%, #03070d 100%);
          position: relative;
          overflow: hidden;
        }

        .orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(100px);
          pointer-events: none;
        }

        .orb1 {
          width: 260px;
          height: 260px;
          background: #00eaff;
          left: 6%;
          top: 9%;
          opacity: 0.24;
        }

        .orb2 {
          width: 300px;
          height: 300px;
          background: #0077ff;
          right: 8%;
          bottom: 7%;
          opacity: 0.22;
        }

        .shell {
          width: 100%;
          max-width: 1220px;
          border-radius: 34px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 420px 1fr;
          position: relative;
          background: linear-gradient(180deg, rgba(6, 12, 20, 0.92), rgba(4, 10, 18, 0.88));
          border: 1px solid rgba(0, 255, 255, 0.25);
          backdrop-filter: blur(14px);
          box-shadow:
            0 0 18px rgba(0, 255, 255, 0.22),
            0 0 45px rgba(0, 200, 255, 0.18),
            0 0 120px rgba(0, 150, 255, 0.1),
            inset 0 0 20px rgba(255, 255, 255, 0.03);
          animation: shellPulse 6s ease-in-out infinite;
        }

        .shell::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: 34px;
          box-shadow:
            inset 0 0 0 1px rgba(120, 245, 255, 0.14),
            inset 0 0 22px rgba(0, 238, 255, 0.07);
        }

        .shell::after {
          content: "";
          position: absolute;
          top: -40%;
          left: -50%;
          width: 40%;
          height: 180%;
          transform: rotate(20deg);
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(0, 255, 255, 0.08) 35%,
            rgba(0, 255, 255, 0.45) 50%,
            rgba(0, 255, 255, 0.08) 65%,
            transparent 100%
          );
          filter: blur(8px);
          animation: neonSweep 6s linear infinite;
          pointer-events: none;
        }

        .shellEnter {
          animation:
            shellPulse 6s ease-in-out infinite,
            shellFadeIn 0.28s ease-out;
        }

        .shellExit {
          animation: shellFadeOut 0.28s ease-out forwards;
        }

        @keyframes shellPulse {
          0% {
            box-shadow:
              0 0 18px rgba(0, 255, 255, 0.22),
              0 0 45px rgba(0, 200, 255, 0.18),
              0 0 120px rgba(0, 150, 255, 0.1),
              inset 0 0 20px rgba(255, 255, 255, 0.03);
          }
          50% {
            box-shadow:
              0 0 30px rgba(0, 255, 255, 0.35),
              0 0 70px rgba(0, 200, 255, 0.3),
              0 0 160px rgba(0, 150, 255, 0.16),
              inset 0 0 25px rgba(255, 255, 255, 0.04);
          }
          100% {
            box-shadow:
              0 0 18px rgba(0, 255, 255, 0.22),
              0 0 45px rgba(0, 200, 255, 0.18),
              0 0 120px rgba(0, 150, 255, 0.1),
              inset 0 0 20px rgba(255, 255, 255, 0.03);
          }
        }

        @keyframes neonSweep {
          0% {
            left: -50%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            left: 120%;
            opacity: 0;
          }
          100% {
            left: 120%;
            opacity: 0;
          }
        }

        @keyframes shellFadeIn {
          from {
            opacity: 0;
            transform: translateX(18px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shellFadeOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-18px);
          }
        }

        .leftPanel {
          position: relative;
          background:
            linear-gradient(135deg, rgba(0, 255, 255, 0.14), rgba(0, 100, 120, 0.08)),
            linear-gradient(180deg, #07121e 0%, #0a1f2c 100%);
          border-right: 1px solid rgba(0, 238, 255, 0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 42px;
          clip-path: polygon(0 0, 100% 0, 84% 100%, 0 100%);
        }

        .leftInner {
          color: white;
          text-align: left;
          max-width: 270px;
          position: relative;
          z-index: 2;
        }

        .leftInner h1 {
          margin: 0;
          font-size: 42px;
          line-height: 1.02;
          font-weight: 900;
          text-shadow:
            0 0 10px rgba(0, 238, 255, 0.2),
            0 0 24px rgba(0, 238, 255, 0.14);
        }

        .leftInner p {
          margin: 18px 0 0;
          color: #c8fbff;
          line-height: 1.7;
          font-size: 15px;
        }

        .ghostBtn {
          margin-top: 28px;
          padding: 12px 28px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.75);
          background: transparent;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          transition: 0.25s ease;
          box-shadow:
            0 0 10px rgba(0, 238, 255, 0.14),
            inset 0 0 16px rgba(255, 255, 255, 0.03);
        }

        .ghostBtn:hover {
          background: rgba(255, 255, 255, 0.08);
          box-shadow:
            0 0 14px rgba(0, 238, 255, 0.2),
            inset 0 0 18px rgba(255, 255, 255, 0.04);
        }

        .ghostBtn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }

        .rightPanel {
          padding: 42px 42px 36px;
          background: linear-gradient(180deg, rgba(3, 8, 15, 0.96), rgba(5, 12, 20, 0.92));
          position: relative;
          z-index: 2;
        }

        .rightPanel h2 {
          margin: 0 0 24px;
          text-align: center;
          font-size: 38px;
          color: #ffffff;
          font-weight: 900;
          text-shadow: 0 0 14px rgba(0, 238, 255, 0.18);
        }

        .formGrid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .row.two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field label,
        .empTitle {
          display: block;
          color: #9cf8ff;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }

        .field label span,
        .empTitle span,
        .reqText span {
          color: #ff5f77;
        }

        .field input,
        .field select {
          width: 100%;
          min-height: 50px;
          border: 1px solid rgba(0, 238, 255, 0.18);
          background: rgba(10, 20, 32, 0.88);
          border-radius: 16px;
          padding: 14px 16px;
          outline: none;
          color: #ffffff;
          font-size: 14px;
          transition: 0.22s ease;
          box-shadow: inset 0 0 16px rgba(0, 238, 255, 0.02);
        }

        .field input::placeholder {
          color: rgba(213, 247, 255, 0.38);
        }

        .field input:focus,
        .field select:focus {
          border-color: rgba(0, 238, 255, 0.62);
          box-shadow:
            0 0 0 3px rgba(0, 238, 255, 0.1),
            0 0 18px rgba(0, 238, 255, 0.08),
            inset 0 0 16px rgba(0, 238, 255, 0.04);
        }

        .passWrap {
          position: relative;
        }

        .passWrap input {
          padding-right: 58px;
        }

        .eyeBtn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(0, 238, 255, 0.16);
          background: rgba(255, 255, 255, 0.03);
          color: #9df6ff;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: 0.22s ease;
          margin: 0;
          padding: 0;
          box-shadow: none;
        }

        .eyeBtn:hover {
          background: rgba(0, 238, 255, 0.08);
          color: #ffffff;
          box-shadow: 0 0 12px rgba(0, 238, 255, 0.12);
        }

        .tip {
          margin: 8px 0 0;
          color: #9eb8c4;
          font-size: 12px;
        }

        .errorText {
          margin-top: 8px;
          color: #ff6f86;
          font-size: 12px;
          font-weight: 700;
        }

        .empBox {
          border: 1px solid rgba(0, 238, 255, 0.16);
          border-radius: 18px;
          padding: 16px;
          background: rgba(8, 16, 28, 0.72);
          box-shadow: inset 0 0 18px rgba(0, 238, 255, 0.03);
        }

        .empGrid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .empOpt {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(0, 238, 255, 0.16);
          border-radius: 14px;
          padding: 12px 14px;
          cursor: pointer;
          color: #dffcff;
          background: rgba(255, 255, 255, 0.02);
          transition: 0.2s ease;
        }

        .empOpt:hover {
          border-color: rgba(0, 238, 255, 0.34);
          box-shadow: 0 0 14px rgba(0, 238, 255, 0.08);
        }

        .empOpt.active {
          border-color: rgba(0, 238, 255, 0.55);
          background: rgba(0, 238, 255, 0.08);
          box-shadow:
            0 0 14px rgba(0, 238, 255, 0.1),
            inset 0 0 16px rgba(0, 238, 255, 0.03);
        }

        .empOpt span {
          font-size: 14px;
          font-weight: 700;
        }

        .submitBtn {
          margin-top: 4px;
          width: 100%;
          min-height: 54px;
          border: 1px solid rgba(0, 238, 255, 0.38);
          border-radius: 18px;
          background: linear-gradient(180deg, #29ebff 0%, #00b7d0 100%);
          color: #031018;
          font-size: 17px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.25s ease;
          box-shadow:
            0 0 12px rgba(0, 238, 255, 0.3),
            0 0 28px rgba(0, 238, 255, 0.16);
        }

        .submitBtn:hover {
          transform: translateY(-1px);
          box-shadow:
            0 0 16px rgba(0, 238, 255, 0.4),
            0 0 34px rgba(0, 238, 255, 0.22);
        }

        .submitBtn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
          transform: none;
        }

        .loginText {
          text-align: center;
          color: #a7bfca;
          margin: 2px 0 0;
          font-size: 14px;
        }

        .inlineLink {
          background: transparent;
          border: none;
          padding: 0;
          margin: 0;
          color: #96f7ff;
          font-weight: 800;
          cursor: pointer;
          box-shadow: none;
        }

        .inlineLink:hover {
          text-decoration: underline;
          transform: none;
          background: transparent;
        }

        .inlineLink:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }

        .reqText {
          text-align: center;
          color: #8196a3;
          font-size: 12px;
          margin: 0;
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .shell {
            grid-template-columns: 1fr;
          }

          .leftPanel {
            clip-path: none;
            min-height: 240px;
            border-right: none;
            border-bottom: 1px solid rgba(0, 238, 255, 0.16);
          }

          .leftInner {
            max-width: 100%;
            text-align: center;
          }
        }

        @media (max-width: 720px) {
          .page {
            padding: 16px;
          }

          .rightPanel {
            padding: 26px 18px 22px;
          }

          .leftPanel {
            padding: 30px 20px;
          }

          .rightPanel h2 {
            font-size: 30px;
          }

          .leftInner h1 {
            font-size: 32px;
          }

          .row.two,
          .empGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}