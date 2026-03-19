"use client";

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
        <ProtectedShell>{children}</ProtectedShell>
      </ProtectedThemeProvider>
    </AuthProvider>
  );
}
