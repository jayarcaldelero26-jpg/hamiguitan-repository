import { NextRequest, NextResponse } from "next/server";
import { createOAuthClient } from "../../../lib/googleDrive";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code received" }, { status: 400 });
  }

  const oauth2Client = createOAuthClient();

  const { tokens } = await oauth2Client.getToken(code);

  console.log("ACCESS TOKEN:", tokens.access_token);
  console.log("REFRESH TOKEN:", tokens.refresh_token);

  return NextResponse.json({
    message: "Authentication successful. Check terminal for refresh token.",
  });
}