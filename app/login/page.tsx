"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ToastProvider";
import ConfirmDialog from "@/app/components/ConfirmDialog";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [leaving, setLeaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("Login failed.");

  useEffect(() => {
    let mounted = true;
    fetch("/api/me", { credentials: "include" })
      .then((res) => {
        if (!mounted) return;
        if (res.ok) window.location.replace("/dashboard");
      })
      .catch(() => {});
    return () => {
      mounted = false;
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

      toast({
        type: "success",
        title: "Welcome!",
        message: "Login successful",
      });

      window.location.assign("/dashboard");
    } catch {
      setErrorMsg("Server unreachable. Check internet / run dev server.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <ConfirmDialog
        open={showError}
        title="Login failed"
        message={errorMsg}
        confirmText="OK"
        cancelText=""
        danger
        onConfirm={() => setShowError(false)}
      />

      <div className="bgGlow bgGlow1" />
      <div className="bgGlow bgGlow2" />

      <div className={`card ${leaving ? "cardExit" : "cardEnter"}`}>
        <div className="forms">
          <div className="panel">
            <h2>Login</h2>

            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
            />

            <label>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) handleLogin();
              }}
            />

            <button type="button" disabled={loading || leaving} onClick={handleLogin}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </div>
        </div>

        <div className="overlay">
          <div className="overlayInner">
            <h1 className="title">WELCOME BACK!</h1>
            <p className="sub">
              Hamiguitan Repository
              <br />
              Secure documents for Stakeholders and Academe Records.
            </p>

            <button
              type="button"
              className="ghost"
              onClick={goRegister}
              disabled={loading || leaving}
            >
              Register
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(0, 255, 255, 0.08), transparent 28%),
            radial-gradient(circle at bottom right, rgba(0, 200, 255, 0.08), transparent 30%),
            linear-gradient(135deg, #02040a 0%, #07111d 45%, #03070d 100%);
        }

        .bgGlow {
          position: absolute;
          border-radius: 999px;
          filter: blur(90px);
          pointer-events: none;
        }

        .bgGlow1 {
          width: 260px;
          height: 260px;
          background: #00f0ff;
          top: 12%;
          left: 10%;
          opacity: 0.22;
        }

        .bgGlow2 {
          width: 300px;
          height: 300px;
          background: #009dff;
          bottom: 10%;
          right: 10%;
          opacity: 0.2;
        }

        .card {
          width: 980px;
          max-width: 100%;
          height: 560px;
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(6, 12, 20, 0.92), rgba(4, 10, 18, 0.88));
          border: 1px solid rgba(0, 255, 255, 0.25);
          backdrop-filter: blur(14px);
          box-shadow:
            0 0 18px rgba(0, 255, 255, 0.25),
            0 0 45px rgba(0, 200, 255, 0.2),
            0 0 120px rgba(0, 150, 255, 0.12),
            inset 0 0 20px rgba(255, 255, 255, 0.03);
          animation: borderPulse 6s ease-in-out infinite;
        }

        .card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 28px;
          pointer-events: none;
          box-shadow:
            inset 0 0 0 1px rgba(120, 245, 255, 0.14),
            inset 0 0 22px rgba(0, 238, 255, 0.07);
        }

        .card::after {
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

        .cardEnter {
          animation:
            borderPulse 6s ease-in-out infinite,
            cardFadeIn 0.28s ease-out;
        }

        .cardExit {
          animation: cardFadeOut 0.28s ease-out forwards;
        }

        @keyframes borderPulse {
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

        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateX(18px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes cardFadeOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-18px);
          }
        }

        .forms {
          position: absolute;
          inset: 0;
          width: 50%;
          z-index: 2;
          background: linear-gradient(180deg, rgba(3, 9, 18, 0.95), rgba(5, 11, 21, 0.92));
          clip-path: polygon(0 0, 82% 0, 100% 100%, 0 100%);
        }

        .panel {
          position: absolute;
          inset: 0;
          padding: 70px 76px 70px 58px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        h2 {
          margin: 0 0 20px;
          font-size: 34px;
          font-weight: 800;
          color: #ffffff;
          text-shadow: 0 0 12px rgba(0, 238, 255, 0.25);
        }

        label {
          margin: 12px 0 8px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: #89f7ff;
        }

        input {
          width: 100%;
          padding: 14px 16px;
          border: none;
          border-bottom: 1px solid rgba(108, 238, 255, 0.45);
          background: transparent;
          outline: none;
          font-size: 14px;
          color: #ffffff;
          transition: 0.22s ease;
          box-shadow: inset 0 -1px 0 rgba(0, 255, 255, 0.04);
        }

        input::placeholder {
          color: rgba(215, 247, 255, 0.38);
        }

        input:focus {
          border-bottom-color: #00f0ff;
          box-shadow:
            0 10px 18px rgba(0, 240, 255, 0.06),
            inset 0 -1px 0 rgba(0, 240, 255, 0.68);
        }

        button {
          margin-top: 28px;
          padding: 14px 16px;
          border-radius: 999px;
          border: 1px solid rgba(0, 238, 255, 0.38);
          background: linear-gradient(180deg, #30eaff 0%, #16cde5 100%);
          color: #031018;
          font-weight: 800;
          cursor: pointer;
          transition: 0.22s ease;
          box-shadow:
            0 0 12px rgba(0, 238, 255, 0.3),
            0 0 26px rgba(0, 238, 255, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.45);
        }

        button:hover {
          transform: translateY(-1px);
          box-shadow:
            0 0 16px rgba(0, 238, 255, 0.4),
            0 0 34px rgba(0, 238, 255, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }

        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .overlay {
          position: absolute;
          top: 0;
          right: 0;
          width: 56%;
          height: 100%;
          z-index: 1;
          border-left: 1px solid rgba(0, 238, 255, 0.16);
          clip-path: polygon(18% 0, 100% 0, 100% 100%, 0 100%);
          background:
            linear-gradient(135deg, rgba(0, 255, 255, 0.14), rgba(0, 100, 120, 0.08)),
            linear-gradient(180deg, #07121e 0%, #0a1f2c 100%);
          box-shadow: inset 0 0 35px rgba(0, 238, 255, 0.08);
        }

        .overlay::before {
          content: "";
          position: absolute;
          inset: 18px;
          border: 1px solid rgba(0, 238, 255, 0.13);
          clip-path: polygon(18% 0, 100% 0, 100% 100%, 0 100%);
          pointer-events: none;
        }

        .overlayInner {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 54px 0 110px;
          color: #fff;
          position: relative;
          z-index: 2;
        }

        .title {
          margin: 0 0 12px;
          font-size: 40px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #ffffff;
          text-shadow:
            0 0 10px rgba(0, 238, 255, 0.2),
            0 0 24px rgba(0, 238, 255, 0.14);
        }

        .sub {
          margin: 0 0 24px;
          opacity: 0.92;
          line-height: 1.7;
          font-size: 14px;
          color: #c8fbff;
        }

        .ghost {
          margin-top: 6px;
          padding: 12px 28px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.75);
          background: transparent;
          color: #fff;
          font-weight: 800;
          box-shadow:
            0 0 10px rgba(0, 238, 255, 0.14),
            inset 0 0 16px rgba(255, 255, 255, 0.03);
        }

        .ghost:hover {
          background: rgba(255, 255, 255, 0.08);
          box-shadow:
            0 0 14px rgba(0, 238, 255, 0.2),
            inset 0 0 18px rgba(255, 255, 255, 0.04);
        }

        @media (max-width: 900px) {
          .card {
            height: auto;
            min-height: 520px;
          }

          .forms {
            width: 100%;
            position: relative;
            clip-path: none;
            background: rgba(4, 10, 18, 0.96);
          }

          .overlay {
            display: none;
          }

          .panel {
            position: relative;
            padding: 44px 24px;
          }
        }
      `}</style>
    </div>
  );
}