import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0f2822] text-white">
      <div className="public-container grid gap-[32px] py-[48px] md:grid-cols-[1.2fr_0.8fr] md:gap-[48px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c7d5ce]">
            Mt. Hamiguitan Range Wildlife Sanctuary
          </p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#d7e1dc]/84">
            Protected Area Management Office public information site for
            sanctuary identity, coordination, and institutional reference.
          </p>
        </div>

        <div className="grid gap-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c7d5ce]">
            Navigation
          </p>
          <div className="grid gap-2 text-[#e7eee9]">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <Link href="/about" className="transition hover:text-white">
              About Us
            </Link>
            <Link href="/contact" className="transition hover:text-white">
              Contact
            </Link>
            <Link href="/login" className="transition hover:text-white">
              Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
