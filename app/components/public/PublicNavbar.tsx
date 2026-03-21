"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/#trail-highlights", label: "Trail Info" },
  { href: "/schedule", label: "Climb Schedule" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export default function PublicNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-2.5 pt-2.5 text-[var(--public-text)] sm:px-4 sm:pt-4">
      <div className="public-container">
        <div className="public-nav-shell flex items-center justify-between rounded-[18px] px-2.5 py-2 sm:rounded-[24px] sm:px-4 sm:py-3 md:px-5">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 text-[var(--public-text)] sm:gap-4"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-1 shadow-[0_6px_16px_rgba(0,0,0,0.18)] sm:h-14 sm:w-14 sm:rounded-2xl sm:p-2 sm:shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
              <Image
                src="/branding/mhrws-logo.png"
                alt="Mount Hamiguitan Range Wildlife Sanctuary logo"
                fill
                sizes="(min-width: 640px) 56px, 44px"
                className="object-contain p-1"
                priority
              />
            </span>
            <span className="min-w-0 max-w-[170px] leading-tight sm:max-w-none">
              <span className="block truncate text-[0.82rem] font-bold uppercase tracking-[0.1em] text-[var(--public-text)] sm:text-[1.14rem] sm:tracking-[0.14em]">
                Mt. Hamiguitan
              </span>
              <span className="block truncate text-[0.62rem] font-medium tracking-[0.06em] text-[var(--public-text-muted)] sm:text-[0.8rem] sm:tracking-[0.08em]">
                Range Wildlife Sanctuary
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`public-nav-link rounded-full border px-4 py-2 text-sm font-medium ${
                  isActive(pathname, item.href)
                    ? "public-nav-link-active"
                    : "border-transparent"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="public-button-primary ml-3 inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
            >
              Sign In
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] border border-white/10 bg-white/8 text-[var(--public-text)] shadow-[0_6px_16px_rgba(0,0,0,0.16)] md:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="public-container md:hidden">
          <div className="public-nav-shell mt-2 rounded-[18px] border px-2.5 py-2.5 sm:rounded-[24px] sm:px-4 sm:py-3">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`public-nav-link rounded-2xl border px-3.5 py-2.5 text-sm font-medium ${
                    isActive(pathname, item.href) ? "public-nav-link-active" : "border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="public-button-primary mt-2 inline-flex min-h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
