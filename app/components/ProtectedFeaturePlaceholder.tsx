import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function ProtectedFeaturePlaceholder({
  eyebrow,
  title,
  description,
  detail,
}: {
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(35,83,71,0.52),rgba(11,43,38,0.82))] p-8 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl md:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EB69B]">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#DAF1DE] md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[#DAF1DE]/78 md:text-lg">
          {description}
        </p>
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.05] p-5 text-sm leading-7 text-[#DAF1DE]/72">
          {detail}
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="app-primary-button app-sidebar-btn app-sidebar-btn-primary inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/research"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-6 font-semibold text-[#DAF1DE] transition hover:bg-white/[0.08]"
          >
            Open Document Repository
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
