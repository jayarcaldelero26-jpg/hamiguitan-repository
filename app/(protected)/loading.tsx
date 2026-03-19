export default function ProtectedLoading() {
  return (
    <section className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[34px] border border-[var(--ui-border)] bg-[var(--ui-card-bg)] p-5 shadow-[var(--ui-card-shadow)] md:p-7">
          <div className="animate-pulse">
            <div className="h-3 w-36 rounded-full bg-white/10" />
            <div className="mt-4 h-10 w-56 rounded-2xl bg-white/10" />
            <div className="mt-4 h-5 max-w-3xl rounded-full bg-white/10" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[24px] border border-[var(--ui-border)] bg-[var(--ui-panel-soft-bg)] p-5"
              >
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="mt-4 h-8 w-28 rounded-2xl bg-white/10" />
                <div className="mt-4 h-4 w-full rounded-full bg-white/10" />
                <div className="mt-2 h-4 w-4/5 rounded-full bg-white/10" />
              </div>
            ))}
          </div>

          <div className="mt-6 animate-pulse rounded-[28px] border border-[var(--ui-border)] bg-[var(--ui-panel-bg)] p-5">
            <div className="h-5 w-40 rounded-full bg-white/10" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-16 rounded-[20px] bg-white/10" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
