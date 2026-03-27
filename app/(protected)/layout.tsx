import { redirect } from "next/navigation";
import { AuthProvider, type AuthUser } from "@/app/components/AuthProvider";
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

  const initialUser: AuthUser = {
    ...user,
    avatar: user.avatar ?? undefined,
  };

  return (
    <AuthProvider initialUser={initialUser} redirectTo="/login">
      <ProtectedThemeProvider>
        <ProtectedShell>{children}</ProtectedShell>
      </ProtectedThemeProvider>
    </AuthProvider>
  );
}
