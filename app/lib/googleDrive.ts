// app/lib/googleDrive.ts
import { google } from "googleapis";

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getDriveClient() {
  const oauth = createOAuthClient();

  // ✅ use refresh token for server-side Drive access
  oauth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.drive({ version: "v3", auth: oauth });
}