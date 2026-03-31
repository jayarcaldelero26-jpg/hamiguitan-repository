import Image from "next/image";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import PublicShell from "@/app/components/public/PublicShell";
import { Reveal } from "@/app/components/public/ScrollReveal";
import { formatMonthLabel } from "@/app/lib/bookingUtils";
import PublicScheduleCalendarClient from "@/app/schedule/PublicScheduleCalendarClient";

function getValidMonth(value?: string) {
  return /^\d{4}-\d{2}$/.test(String(value || ""))
    ? String(value)
    : new Date().toISOString().slice(0, 7);
}

export default async function PublicSchedulePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const monthParam = Array.isArray(params.month) ? params.month[0] : params.month;
  const month = getValidMonth(monthParam);

  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden border-b border-[var(--public-border)] bg-[#06090f]">
        <div className="absolute inset-0">
          <Image
            src="/images/carousel/carousel-04.optimized.avif"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={65}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,9,14,0.18)_0%,rgba(6,9,14,0.28)_36%,rgba(5,7,11,0.74)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(245,158,11,0.14),transparent_18%),radial-gradient(circle_at_76%_18%,rgba(120,180,157,0.14),transparent_18%),linear-gradient(90deg,rgba(7,10,16,0.2)_0%,rgba(7,10,16,0.04)_42%,rgba(7,10,16,0.36)_100%)]" />
        </div>

        <div className="public-container relative py-24 md:py-28">
          <Reveal className="max-w-4xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="public-eyebrow">Climb Schedule</p>
                <h1 className="mt-4 max-w-3xl text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--public-text)] sm:text-[3rem] lg:text-[4rem]">
                  Check monthly trail availability
                </h1>
                <p className="mt-5 max-w-2xl text-[1rem] leading-8 text-[rgba(236,242,249,0.88)] sm:text-[1.06rem]">
                  See a polished public summary of San Isidro and Governor Generoso trail availability by month.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3 md:max-w-[20rem] md:justify-end">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-[rgba(8,12,18,0.3)] px-4 py-3 text-sm text-[var(--public-text)]">
                  <CalendarDaysIcon className="h-5 w-5 text-[var(--public-accent)]" />
                  <span className="font-semibold">{formatMonthLabel(month)}</span>
                </div>
                <p className="max-w-xs text-sm leading-7 text-[rgba(236,242,249,0.68)]">
                  Move between months below and scan both trail capacities at a glance.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="public-section public-section-light">
        <div className="public-container max-w-[1180px]">
          <PublicScheduleCalendarClient month={month} />
        </div>
      </section>
    </PublicShell>
  );
}
