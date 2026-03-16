export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getDriveClient, listChildFolders } from "@/app/lib/googleDrive";
import { getCurrentUser } from "@/app/lib/auth";
import { serverEnv } from "@/app/lib/serverEnv";

export async function GET() {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const drive = getDriveClient();

    const [academe, stakeholders, pamo] = await Promise.all([
      listChildFolders(drive, serverEnv.driveAcademeFolderId),
      listChildFolders(drive, serverEnv.driveStakeholdersFolderId),
      listChildFolders(drive, serverEnv.drivePamoFolderId),
    ]);

    return NextResponse.json({
      academe,
      stakeholders,
      pamo,
    });
  } catch (error) {
    console.error("FOLDERS GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load folders." },
      { status: 500 }
    );
  }
}
