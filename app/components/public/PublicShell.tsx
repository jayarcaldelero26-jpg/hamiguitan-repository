import PublicFooter from "@/app/components/public/PublicFooter";
import PublicNavbar from "@/app/components/public/PublicNavbar";

export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-shell min-h-screen">
      <PublicNavbar />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
