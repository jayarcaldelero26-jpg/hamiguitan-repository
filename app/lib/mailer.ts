import nodemailer from "nodemailer";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const mailer = nodemailer.createTransport({
  host: requiredEnv("SMTP_HOST"),
  port: Number(requiredEnv("SMTP_PORT")),
  secure: requiredEnv("SMTP_SECURE") === "true",
  auth: {
    user: requiredEnv("SMTP_USER"),
    pass: requiredEnv("SMTP_PASS"),
  },
});

export async function sendResetCodeEmail(email: string, code: string) {
  await mailer.sendMail({
    from: requiredEnv("SMTP_FROM"),
    to: email,
    subject: "Your password reset verification code",
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#111827">
        <h2>Password Reset Verification</h2>
        <p>We received a request to reset your password for the MHRWS Repository account.</p>
        <p>Your verification code is:</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;margin:16px 0;color:#06b6d4;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}