import PublicShell from "@/app/components/public/PublicShell";

export default function Loading() {
  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden border-b border-[var(--public-border)] bg-[#06090f]">
        <div className="public-container relative py-24 md:py-28">
          <div className="max-w-4xl animate-pulse">
            <div className="h-4 w-32 rounded-full bg-white/10" />
            <div className="mt-5 h-14 max-w-2xl rounded-[24px] bg-white/10 sm:h-16" />
            <div className="mt-5 h-6 max-w-xl rounded-full bg-white/8" />
          </div>
        </div>
      </section>

      <section className="public-section public-section-light">
        <div className="public-container max-w-[1180px]">
          <div className="animate-pulse">
            <div className="h-4 w-24 rounded-full bg-white/10" />
            <div className="mt-4 h-10 w-72 rounded-[20px] bg-white/10" />
          </div>

          <div className="public-card mt-6 overflow-hidden p-4 md:p-6">
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {Array.from({ length: 6 }, (_, index) => (
                <article
                  key={index}
                  className="min-h-[142px] rounded-[20px] border border-[var(--public-border)] bg-[rgba(255,255,255,0.04)] px-4 py-4"
                >
                  <div className="flex h-full animate-pulse flex-col justify-between">
                    <div>
                      <div className="h-5 w-20 rounded-full bg-white/10" />
                      <div className="mt-3 h-4 w-16 rounded-full bg-white/8" />
                    </div>
                    <div className="mt-4">
                      <div className="h-6 w-20 rounded-full bg-white/10" />
                      <div className="mt-3 h-4 w-14 rounded-full bg-white/8" />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden md:block">
              <div className="grid grid-cols-7 gap-3 text-center">
                {Array.from({ length: 7 }, (_, index) => (
                  <div
                    key={index}
                    className="h-4 rounded-full bg-white/8 px-2 py-2"
                  />
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-3">
                {Array.from({ length: 35 }, (_, index) => (
                  <article
                    key={index}
                    className="min-h-[132px] rounded-[20px] border border-[var(--public-border)] p-4"
                  >
                    <div className="flex h-full animate-pulse flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="h-4 w-5 rounded-full bg-white/10" />
                        <div className="h-5 w-16 rounded-full bg-white/8" />
                      </div>
                      <div className="h-5 w-16 rounded-full bg-white/10" />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
