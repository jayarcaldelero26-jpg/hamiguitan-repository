import "server-only";

import nodemailer from "nodemailer";
import { serverEnv } from "@/app/lib/serverEnv";

export const mailer = nodemailer.createTransport({
  host: serverEnv.smtpHost,
  port: serverEnv.smtpPort,
  secure: serverEnv.smtpSecure,
  auth: {
    user: serverEnv.smtpUser,
    pass: serverEnv.smtpPass,
  },
});

/*
Optional but recommended:
Verify SMTP connection on startup
*/
if (process.env.NODE_ENV !== "test") {
  mailer.verify().then(() => {
    console.log("SMTP connection ready");
  }).catch((err) => {
    console.error("SMTP connection failed:", err);
  });
}

export async function sendResetCodeEmail(email: string, code: string) {
  const html = `
  <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#111827">
    <h2>Password Reset Verification</h2>
    <p>We received a request to reset your password for the MHRWS Repository account.</p>
    <p>Your verification code is:</p>

    <div style="
      font-size:32px;
      font-weight:800;
      letter-spacing:8px;
      margin:16px 0;
      color:#06b6d4;
    ">
      ${code}
    </div>

    <p>This code will expire in 10 minutes.</p>
    <p>If you did not request this, you can ignore this email.</p>
  </div>
  `;

  const text = `
Password Reset Verification

Your verification code is: ${code}

This code will expire in 10 minutes.

If you did not request this, you can ignore this email.
`;

  await mailer.sendMail({
    from: serverEnv.smtpFrom,
    to: email,
    subject: "Your password reset verification code",
    text,
    html,
  });
}
