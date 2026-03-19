import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-[var(--ui-border)] bg-[#181f27] text-[var(--ui-text-main)]">
      <div className="public-container grid gap-[32px] py-[48px] md:grid-cols-[1.1fr_0.9fr] md:gap-[48px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--ui-accent-soft)]">
            Mt. Hamiguitan Range Wildlife Sanctuary
          </p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[color:rgba(151,166,168,0.92)]">
            Public-facing trail information, climb scheduling access, and
            booking guidance for visitors planning a Mount Hamiguitan
            experience within a protected UNESCO World Heritage landscape.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-accent-soft)]">
              Quick Links
            </p>
            <div className="grid gap-2 text-[var(--ui-text-main)]">
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
              <Link href="/about" className="transition hover:text-white">
                About
              </Link>
              <Link href="/#trail-highlights" className="transition hover:text-white">
                Trail Info
              </Link>
              <Link href="/contact" className="transition hover:text-white">
                Contact
              </Link>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-accent-soft)]">
              Planning
            </p>
            <div className="grid gap-2 text-[var(--ui-text-main)]">
              <Link href="/calendar" className="transition hover:text-white">
                Climb Schedule
              </Link>
              <Link href="/booking" className="transition hover:text-white">
                Book Now
              </Link>
              <Link href="/login" className="transition hover:text-white">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
