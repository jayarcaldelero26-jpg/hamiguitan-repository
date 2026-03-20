import Link from "next/link";
import { Facebook, Mail, MapPin } from "lucide-react";
import { PUBLIC_TREKKING_CONTACT } from "@/app/lib/publicContact";

export default function PublicFooter() {
  return (
    <footer className="relative border-t border-[var(--public-border)] bg-[linear-gradient(180deg,rgba(7,10,16,0.86),rgba(5,7,11,0.96))] text-[var(--public-text)]">
      <div className="public-container grid gap-8 py-14 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
        <div className="public-card public-panel-highlight p-7 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--public-accent)]">
            Mt. Hamiguitan Range Wildlife Sanctuary
          </p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--public-text-muted)]">
            Public-facing trail information, climb scheduling access, and
            booking guidance for visitors planning a Mount Hamiguitan
            experience within a protected UNESCO World Heritage landscape.
          </p>
          <div className="public-glow-divider mt-6" />
          <p className="mt-6 text-sm leading-7 text-[var(--public-text-muted)]">
            Built to keep public coordination clear while preserving a distinct separation from protected administrative tools.
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            <Link href={`mailto:${PUBLIC_TREKKING_CONTACT.email}`} className="public-contact-link inline-flex w-fit items-start gap-2">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--public-accent)]" />
              <span>{PUBLIC_TREKKING_CONTACT.email}</span>
            </Link>
            <Link
              href={PUBLIC_TREKKING_CONTACT.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="public-contact-link inline-flex w-fit items-start gap-2"
            >
              <Facebook className="mt-0.5 h-5 w-5 shrink-0 text-[var(--public-accent)]" />
              <span>{PUBLIC_TREKKING_CONTACT.facebookLabel}</span>
            </Link>
            <p className="inline-flex max-w-xl items-start gap-2 leading-7 text-[var(--public-text-muted)]">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--public-accent)]" />
              <span>{PUBLIC_TREKKING_CONTACT.address}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="public-card p-7 text-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--public-accent)]">
              Quick Links
            </p>
            <div className="mt-5 grid gap-3 text-[var(--public-text)]">
              <Link href="/" className="public-nav-link">
                Home
              </Link>
              <Link href="/about" className="public-nav-link">
                About
              </Link>
              <Link href="/#trail-highlights" className="public-nav-link">
                Trail Info
              </Link>
              <Link href="/contact" className="public-nav-link">
                Contact
              </Link>
            </div>
          </div>

          <div className="public-card p-7 text-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--public-accent)]">
              Planning
            </p>
            <div className="mt-5 grid gap-3 text-[var(--public-text)]">
              <Link href="/schedule" className="public-nav-link">
                Climb Schedule
              </Link>
              <Link href="/login" className="public-nav-link">
                Sign In
              </Link>
            </div>
            <div className="public-glow-divider mt-6" />
            <div className="mt-5 grid gap-3">
              <Link href={`mailto:${PUBLIC_TREKKING_CONTACT.email}`} className="public-contact-link inline-flex w-fit items-start gap-2">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--public-accent)]" />
                <span>Email Trekking Office</span>
              </Link>
              <Link
                href={PUBLIC_TREKKING_CONTACT.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="public-contact-link inline-flex w-fit items-start gap-2"
              >
                <Facebook className="mt-0.5 h-5 w-5 shrink-0 text-[var(--public-accent)]" />
                <span>{PUBLIC_TREKKING_CONTACT.facebookLabel}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
