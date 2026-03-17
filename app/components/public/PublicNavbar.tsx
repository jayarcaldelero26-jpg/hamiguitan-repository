"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(11,29,24,0.82)] text-white backdrop-blur-xl">
      <div className="public-container flex items-center justify-between py-3 md:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 text-white sm:gap-4">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/12 bg-[rgba(255,255,255,0.08)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-14 sm:w-14 sm:p-2">
            <Image
              src="/branding/mhrws-logo.png"
              alt="Mount Hamiguitan Range Wildlife Sanctuary logo"
              fill
              sizes="(min-width: 640px) 56px, 44px"
              className="object-contain p-1"
              priority
            />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate text-[9px] font-medium uppercase tracking-[0.18em] text-[#c8d5cf] sm:text-[11px] sm:tracking-[0.22em]">
              Mt. Hamiguitan
            </span>
            <span className="mt-1 block text-[0.9rem] font-bold tracking-[0.01em] text-white sm:text-base">
              Range Wildlife Sanctuary
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-[8px] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive(pathname, item.href)
                  ? "bg-white/12 text-white shadow-[0_12px_24px_rgba(0,0,0,0.16)]"
                  : "text-[#d4dfd9] hover:bg-white/8 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="app-primary-button ml-3 inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
          >
            Login
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-white shadow-[0_10px_28px_rgba(0,0,0,0.18)] md:hidden"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[rgba(11,29,24,0.96)] px-4 py-4 sm:px-6 md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive(pathname, item.href)
                    ? "bg-white/12 text-white"
                    : "text-[#d4dfd9] hover:bg-white/8 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="app-primary-button mt-2 inline-flex min-h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold"
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
