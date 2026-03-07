"use client";

import { DocumentsProvider } from "@/app/components/DocumentsProvider";
import { AuthProvider } from "@/app/components/AuthProvider";
import ProtectedShell from "@/app/components/ProtectedShell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DocumentsProvider>
        <ProtectedShell>{children}</ProtectedShell>
      </DocumentsProvider>
    </AuthProvider>
  );
}