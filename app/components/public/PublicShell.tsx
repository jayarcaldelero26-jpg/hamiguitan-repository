"use client";

import { useEffect } from "react";
import PublicFooter from "@/app/components/public/PublicFooter";
import PublicNavbar from "@/app/components/public/PublicNavbar";

export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.classList.add("public-site-body");

    return () => {
      document.body.classList.remove("public-site-body");
    };
  }, []);

  return (
    <div className="public-shell min-h-screen">
      <PublicNavbar />
      <main className="public-site-main relative z-[1]">{children}</main>
      <PublicFooter />
    </div>
  );
}
