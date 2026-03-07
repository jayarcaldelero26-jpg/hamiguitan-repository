"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    router.replace("/admin/users");
  }, [loading, user, router]);

  return (
    <div className="min-h-full grid place-items-center p-6">
      <div className="rounded-2xl border border-cyan-300/12 bg-white/[0.04] px-6 py-5 text-cyan-100/80">
        Loading admin panel…
      </div>
    </div>
  );
}