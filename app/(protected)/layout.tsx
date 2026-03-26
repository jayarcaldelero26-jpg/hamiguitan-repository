import { redirect } from "next/navigation";
import { AuthProvider } from "@/app/components/AuthProvider";
import ProtectedShell from "@/app/components/ProtectedShell";
import { ProtectedThemeProvider } from "@/app/components/ProtectedThemeProvider";
import { getCurrentUser } from "@/app/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user} redirectTo="/login">
      <ProtectedThemeProvider>
        <ProtectedShell>{children}</ProtectedShell>
      </ProtectedThemeProvider>
    </AuthProvider>
  );
}
