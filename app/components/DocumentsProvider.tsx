"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/app/components/AuthProvider";

export type DocumentRow = {
  id: number;
  fileId: string;
  name: string;
  type: string;
  category?: string | null;
  folder?: string | null;
  title?: string | null;
  year?: string | null;
  uploadedAt?: string | null;
  dateReceived?: string | null;
  sourceModule?: string | null;
  sourceRecordType?: string | null;
  sourceRecordId?: number | null;
  sourceSection?: string | null;
};

type ContextType = {
  documents: DocumentRow[];
  loading: boolean;
  refreshDocuments: () => Promise<void>;
  upsertDocument: (document: DocumentRow) => void;
};

const DocumentsContext = createContext<ContextType | null>(null);

const DOCUMENTS_CACHE_TTL_MS = 15_000;

let cachedDocumentsUserId: number | null = null;
let cachedDocuments: DocumentRow[] | null = null;
let cachedDocumentsAt = 0;
let documentsRequest: Promise<DocumentRow[]> | null = null;

function readDocumentsCache(userId: number) {
  if (
    cachedDocumentsUserId === userId &&
    cachedDocuments &&
    Date.now() - cachedDocumentsAt < DOCUMENTS_CACHE_TTL_MS
  ) {
    return cachedDocuments;
  }

  return null;
}

function writeDocumentsCache(userId: number, documents: DocumentRow[]) {
  cachedDocumentsUserId = userId;
  cachedDocuments = documents;
  cachedDocumentsAt = Date.now();
}

function clearDocumentsCache() {
  cachedDocumentsUserId = null;
  cachedDocuments = null;
  cachedDocumentsAt = 0;
  documentsRequest = null;
}

function mergeDocumentRows(current: DocumentRow[], next: DocumentRow) {
  const existingIndex = current.findIndex((doc) => doc.id === next.id);

  if (existingIndex === -1) {
    return [next, ...current];
  }

  const merged = [...current];
  merged[existingIndex] = {
    ...merged[existingIndex],
    ...next,
  };

  return merged;
}

export function DocumentsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const mountedRef = useRef(true);

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const upsertDocument = useCallback((document: DocumentRow) => {
    if (!user) return;

    setDocuments((current) => {
      const nextDocuments = mergeDocumentRows(current, document);
      writeDocumentsCache(user.id, nextDocuments);
      return nextDocuments;
    });
  }, [user]);

  const loadDocuments = useCallback(async (options?: { force?: boolean }) => {
    if (!user) {
      clearDocumentsCache();
      setDocuments([]);
      setLoading(false);
      return;
    }

    const force = options?.force ?? false;
    const userId = user.id;
    const cached = force ? null : readDocumentsCache(userId);

    if (cached) {
      setDocuments(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (!documentsRequest) {
        documentsRequest = (async () => {
          const res = await fetch("/api/documents", {
            credentials: "include",
            cache: "no-store",
          });

          if (res.status === 401) {
            return [];
          }

          if (!res.ok) {
            console.error("DOCUMENTS GET FAILED:", res.status);
            return [];
          }

          const data = await res.json();

          if (Array.isArray(data)) {
            return data;
          }

          if (Array.isArray(data?.documents)) {
            return data.documents;
          }

          return [];
        })().finally(() => {
          documentsRequest = null;
        });
      }

      const nextDocuments = await documentsRequest;

      if (!mountedRef.current) return;

      writeDocumentsCache(userId, nextDocuments);
      setDocuments(nextDocuments);
    } catch (e) {
      console.error("DOCUMENT LOAD FAILED", e);
      if (!mountedRef.current) return;
      setDocuments([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;

    if (authLoading) {
      setLoading(true);
      return () => {
        mountedRef.current = false;
      };
    }

    if (!user) {
      clearDocumentsCache();
      setDocuments([]);
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    loadDocuments();

    return () => {
      mountedRef.current = false;
    };
  }, [authLoading, user, loadDocuments]);

  return (
    <DocumentsContext.Provider
      value={{
        documents,
        loading,
        refreshDocuments: () => loadDocuments({ force: true }),
        upsertDocument,
      }}
    >
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error("useDocuments must be inside DocumentsProvider");
  return ctx;
}
