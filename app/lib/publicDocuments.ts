import "server-only";

import { supabaseAdmin } from "@/app/lib/db";

export type PublicDocumentRow = {
  id: number;
  title: string;
  kind: "Minutes" | "Resolution";
  date: string;
  fileId: string;
  type: string;
};

export function inferPublicDocumentKind(input: {
  title?: string | null;
  name?: string | null;
  folder?: string | null;
}) {
  const haystack = [input.title, input.name, input.folder].join(" ").toLowerCase();
  if (haystack.includes("resolution")) return "Resolution" as const;
  if (haystack.includes("minute")) return "Minutes" as const;
  return null;
}

export async function listLatestPublicMinutesAndResolutions(limit = 6) {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("id,title,name,folder,dateReceived,uploadedAt,fileId,type")
    .order("uploadedAt", { ascending: false })
    .limit(120);

  if (error) {
    throw new Error(error.message || "Failed to load public documents.");
  }

  const latest = ((data || []) as Array<{
    id: number;
    title?: string | null;
    name?: string | null;
    folder?: string | null;
    dateReceived?: string | null;
    uploadedAt?: string | null;
    fileId?: string | null;
    type?: string | null;
  }>)
    .map((row) => {
      const kind = inferPublicDocumentKind(row);
      if (!kind) return null;

      const title = String(row.title || row.name || "").trim();
      const fileId = String(row.fileId || "").trim();
      if (!title || !fileId) return null;

      return {
        id: row.id,
        title,
        kind,
        date: String(row.dateReceived || row.uploadedAt || "").trim(),
        fileId,
        type: String(row.type || "").trim(),
      } satisfies PublicDocumentRow;
    })
    .filter((row): row is PublicDocumentRow => Boolean(row))
    .slice(0, limit);

  return latest;
}

export async function getPublicDocumentById(id: number) {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("id,fileId,name,type,title,folder")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load public document.");
  }

  if (!data) return null;

  const kind = inferPublicDocumentKind(data);
  if (!kind) return null;

  return {
    id: data.id,
    fileId: String(data.fileId || "").trim(),
    name: String(data.name || "").trim(),
    type: String(data.type || "").trim(),
    title: String(data.title || data.name || "").trim(),
    kind,
  };
}
