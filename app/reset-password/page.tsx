import { Suspense } from "react";
import ResetPasswordContent from "./ResetPasswordContent";

function ResetPasswordFallback() {
  return <div style={{ minHeight: "100vh", background: "#071018" }} />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}