"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
};

type ContextType = {
  documents: DocumentRow[];
  loading: boolean;
  refreshDocuments: () => Promise<void>;
};

const DocumentsContext = createContext<ContextType | null>(null);

export function DocumentsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/documents", {
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        setDocuments([]);
        return;
      }

      if (!res.ok) {
        console.error("DOCUMENTS GET FAILED:", res.status);
        setDocuments([]);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setDocuments(data);
      } else if (Array.isArray(data?.documents)) {
        setDocuments(data.documents);
      } else {
        setDocuments([]);
      }
    } catch (e) {
      console.error("DOCUMENT LOAD FAILED", e);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    loadDocuments();
  }, [authLoading, user, loadDocuments]);

  return (
    <DocumentsContext.Provider
      value={{
        documents,
        loading,
        refreshDocuments: loadDocuments,
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