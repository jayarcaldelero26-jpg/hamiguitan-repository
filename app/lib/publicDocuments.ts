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

function summarizeSupabaseFailure(error: { message?: string | null; details?: string | null; hint?: string | null } | null) {
  const message = String(error?.message || "").trim();
  const details = String(error?.details || "").trim();
  const hint = String(error?.hint || "").trim();
  const lower = `${message} ${details} ${hint}`.toLowerCase();

  return {
    message: message || "Unknown Supabase error",
    details: details || undefined,
    hint: hint || undefined,
    looksLikeHtmlOr502:
      lower.includes("502") ||
      lower.includes("bad gateway") ||
      lower.includes("<html") ||
      lower.includes("<!doctype") ||
      lower.includes("cloudflare"),
    looksLikeProjectConfig: lower.includes("project not specified"),
  };
}

export async function listLatestPublicMinutesAndResolutions(limit = 6) {
  try {
    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("id,title,name,folder,dateReceived,uploadedAt,fileId,type")
      .order("uploadedAt", { ascending: false })
      .limit(120);

    if (error) {
      const summary = summarizeSupabaseFailure(error);
      console.error("[publicDocuments] listLatestPublicMinutesAndResolutions query failed", {
        path: "documents.select(order: uploadedAt desc, limit: 120)",
        message: summary.message,
        details: summary.details,
        hint: summary.hint,
        looksLikeHtmlOr502: summary.looksLikeHtmlOr502,
        looksLikeProjectConfig: summary.looksLikeProjectConfig,
      });
      return [];
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();

    console.error("[publicDocuments] listLatestPublicMinutesAndResolutions request threw", {
      path: "documents.select(order: uploadedAt desc, limit: 120)",
      message,
      looksLikeHtmlOr502:
        lower.includes("502") ||
        lower.includes("bad gateway") ||
        lower.includes("<html") ||
        lower.includes("<!doctype") ||
        lower.includes("cloudflare"),
      looksLikeProjectConfig: lower.includes("project not specified"),
    });

    return [];
  }
}

export async function getPublicDocumentById(id: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("id,fileId,name,type,title,folder")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      const summary = summarizeSupabaseFailure(error);
      console.error("[publicDocuments] getPublicDocumentById query failed", {
        path: "documents.select(id,fileId,name,type,title,folder).eq(id).maybeSingle()",
        id,
        message: summary.message,
        details: summary.details,
        hint: summary.hint,
        looksLikeHtmlOr502: summary.looksLikeHtmlOr502,
        looksLikeProjectConfig: summary.looksLikeProjectConfig,
      });
      return null;
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();

    console.error("[publicDocuments] getPublicDocumentById request threw", {
      path: "documents.select(id,fileId,name,type,title,folder).eq(id).maybeSingle()",
      id,
      message,
      looksLikeHtmlOr502:
        lower.includes("502") ||
        lower.includes("bad gateway") ||
        lower.includes("<html") ||
        lower.includes("<!doctype") ||
        lower.includes("cloudflare"),
      looksLikeProjectConfig: lower.includes("project not specified"),
    });

    return null;
  }
}
