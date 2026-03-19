"use client";

import { DocumentsProvider } from "@/app/components/DocumentsProvider";
import { AuthProvider } from "@/app/components/AuthProvider";
import ProtectedShell from "@/app/components/ProtectedShell";
import { ProtectedThemeProvider } from "@/app/components/ProtectedThemeProvider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedThemeProvider>
        <DocumentsProvider>
          <ProtectedShell>{children}</ProtectedShell>
        </DocumentsProvider>
      </ProtectedThemeProvider>
    </AuthProvider>
  );
}
