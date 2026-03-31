import { NextRequest, NextResponse } from "next/server";
import { createOAuthClient } from "../../../lib/googleDrive";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code received" }, { status: 400 });
  }

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    return NextResponse.json({
      ok: true,
      message:
        "OAuth callback completed in development mode. Tokens were received but are never printed to logs.",
      hasRefreshToken: Boolean(tokens.refresh_token),
    });
  } catch (error) {
    console.error("GOOGLE OAUTH CALLBACK ERROR:", error);
    return NextResponse.json(
      { error: "Failed to exchange OAuth code." },
      { status: 500 }
    );
  }
}
