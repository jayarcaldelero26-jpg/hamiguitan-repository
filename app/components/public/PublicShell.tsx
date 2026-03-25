import PublicFooter from "@/app/components/public/PublicFooter";
import PublicNavbar from "@/app/components/public/PublicNavbar";

export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-shell public-site-body min-h-screen">
      <PublicNavbar />
      <main className="public-site-main relative z-[1]">{children}</main>
      <PublicFooter />
    </div>
  );
}
