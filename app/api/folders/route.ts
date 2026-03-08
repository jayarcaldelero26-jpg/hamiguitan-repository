export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { getDriveClient, listChildFolders } from "@/app/lib/googleDrive";

const SECRET = process.env.JWT_SECRET!;

const ACADEME_ID = process.env.DRIVE_ACADEME_FOLDER_ID!;
const STAKEHOLDERS_ID = process.env.DRIVE_STAKEHOLDERS_FOLDER_ID!;
const PAMO_ID = process.env.DRIVE_PAMO_FOLDER_ID!;

function getToken(req: NextRequest) {
  return req.cookies.get("auth_token")?.value || "";
}

export async function GET(req: NextRequest) {
  const token = getToken(req);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    jwt.verify(token, SECRET);

    if (!ACADEME_ID || !STAKEHOLDERS_ID || !PAMO_ID) {
      return NextResponse.json(
        { error: "Drive folder IDs are not configured." },
        { status: 500 }
      );
    }

    const drive = getDriveClient();

    const [academe, stakeholders, pamo] = await Promise.all([
      listChildFolders(drive, ACADEME_ID),
      listChildFolders(drive, STAKEHOLDERS_ID),
      listChildFolders(drive, PAMO_ID),
    ]);

    return NextResponse.json({
      academe,
      stakeholders,
      pamo,
    });
  } catch (error) {
    console.error("FOLDERS GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load folders." }, { status: 500 });
  }
}