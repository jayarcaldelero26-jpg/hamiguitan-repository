"use client";

import { AuthProvider } from "@/app/components/AuthProvider";
import ProtectedShell from "@/app/components/ProtectedShell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedShell>{children}</ProtectedShell>
    </AuthProvider>
  );
}