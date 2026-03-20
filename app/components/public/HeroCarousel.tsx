"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";

type Slide = {
  image: string;
  title: string;
  subtitle: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
};

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 48;
const partnerLogos = [
  {
    src: "/images/branding/denr-logo.png",
    alt: "DENR logo",
    width: 54,
  },
  {
    src: "/images/branding/asean-logo.png",
    alt: "ASEAN Heritage Parks logo",
    width: 54,
  },
  {
    src: "/images/branding/unesco-logo.png",
    alt: "UNESCO logo",
    width: 54,
  },
] as const;

const slides: Slide[] = [
  {
    image: "/images/carousel/carousel-01.jpg",
    title: "Range Wildlife Sanctuary",
    subtitle:
      "Discover the sanctuary through a homepage that balances protected area information, trail planning, and visitor coordination.",
    primaryCta: {
      label: "About Mount Hamiguitan",
      href: "/about",
    },
    secondaryCta: {
      label: "View Trails",
      href: "/#trail-highlights",
    },
  },
  {
    image: "/images/carousel/carousel-02.jpg",
    title: "Protecting Biodiversity And Natural Heritage",
    subtitle:
      "Learn more about endemic habitats, conservation value, and why Mount Hamiguitan remains one of the Philippines' most important mountain landscapes.",
    primaryCta: {
      label: "Learn More",
      href: "/about",
    },
    secondaryCta: {
      label: "Contact",
      href: "/contact",
    },
  },
  {
    image: "/images/carousel/carousel-03.jpg",
    title: "Trail Information For The Public",
    subtitle:
      "Preview the San Isidro and Governor Generoso trail options before moving into schedule planning and booking.",
    primaryCta: {
      label: "View Trails",
      href: "/#trail-highlights",
    },
    secondaryCta: {
      label: "View Schedule",
      href: "/schedule",
    },
  },
  {
    image: "/images/carousel/carousel-04.jpg",
    title: "Schedule And Climb Preparation",
    subtitle:
      "Use the public schedule view to understand climb timing, trail occupancy, and next steps more clearly.",
    primaryCta: {
      label: "View Schedule",
      href: "/schedule",
    },
    secondaryCta: {
      label: "Sign In",
      href: "/login",
    },
  },
  {
    image: "/images/carousel/carousel-05.jpg",
    title: "Public Access With Protected Systems Separate",
    subtitle:
      "The public website stays focused on visitor information and planning, while protected tools remain separate for authorized users.",
    primaryCta: {
      label: "Contact",
      href: "/contact",
    },
    secondaryCta: {
      label: "Sign In",
      href: "/login",
    },
  },
];

function HeroCarousel() {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const pointerStartXRef = useRef<number | null>(null);
  const pointerActiveRef = useRef(false);

  const isPaused = hoverPaused;
  const activeSlide = useMemo(() => slides[activeIndex] ?? slides[0], [activeIndex]);
  const lightMotion = prefersReducedMotion || isSmallScreen;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsSmallScreen(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (lightMotion || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, lightMotion]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const handlePointerStart = (clientX: number) => {
    pointerStartXRef.current = clientX;
    pointerActiveRef.current = true;
  };

  const handlePointerEnd = (clientX: number) => {
    if (!pointerActiveRef.current || pointerStartXRef.current === null) {
      return;
    }

    const delta = clientX - pointerStartXRef.current;
    pointerStartXRef.current = null;
    pointerActiveRef.current = false;

    if (Math.abs(delta) < SWIPE_THRESHOLD) {
      return;
    }

    if (delta > 0) {
      goToPrevious();
      return;
    }

    goToNext();
  };

  const resetPointerTracking = () => {
    pointerStartXRef.current = null;
    pointerActiveRef.current = false;
  };

  return (
    <section
      className="relative isolate overflow-hidden"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onPointerDown={(event) => handlePointerStart(event.clientX)}
      onPointerUp={(event) => handlePointerEnd(event.clientX)}
      onPointerCancel={resetPointerTracking}
      onPointerLeave={() => {
        if (pointerActiveRef.current) {
          resetPointerTracking();
        }
      }}
    >
      <div className="relative min-h-[72vh] overflow-hidden bg-[#05070b] md:min-h-[88vh]">
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            aria-hidden={index !== activeIndex}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              lightMotion ? "duration-300" : ""
            } ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundColor: "#0a0f16" }}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0.12)_0%,rgba(5,7,11,0.28)_34%,rgba(5,7,11,0.54)_68%,rgba(5,7,11,0.72)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.12),transparent_24%),radial-gradient(circle_at_78%_18%,rgba(245,158,11,0.1),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.06),transparent_30%),linear-gradient(90deg,rgba(5,7,11,0.42)_0%,rgba(5,7,11,0.12)_42%,rgba(5,7,11,0.48)_100%)]" />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 z-[1]">
          {!isSmallScreen ? (
            <>
              <div className="absolute left-[8%] top-[18%] h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.1),transparent_70%)] blur-lg md:h-40 md:w-40" />
              <div className="absolute right-[6%] top-[14%] hidden h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.08),transparent_70%)] blur-xl md:block md:h-48 md:w-48" />
            </>
          ) : null}
        </div>

        <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-[1180px] items-end px-5 pb-14 pt-28 sm:px-6 sm:pb-16 md:min-h-[88vh] md:px-8 md:pb-20 md:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: lightMotion ? 0 : 0.58, ease: [0.22, 1, 0.36, 1] }}
            className="grid w-full items-end gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10"
          >
            <div className="public-panel-highlight pointer-events-auto max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,28,0.68),rgba(7,10,16,0.5))] px-6 py-6 shadow-[0_16px_42px_rgba(0,0,0,0.24)] backdrop-blur-[6px] sm:px-7 sm:py-7 md:rounded-[38px] md:px-9 md:py-9">
              <span className="public-kicker">UNESCO World Heritage Site</span>
              <h1 className="mt-5 text-[2.5rem] font-semibold leading-[0.98] tracking-[-0.05em] text-white sm:text-[3.4rem] md:text-[5rem]">
                <span className="block text-white/96">MT. HAMIGUITAN</span>
                <span className="mt-2 block bg-[linear-gradient(180deg,#ffffff_0%,#ffddb0_100%)] bg-clip-text text-transparent">
                  {activeSlide.title}
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-[0.98rem] leading-8 text-[color:rgba(236,242,249,0.92)] sm:text-[1.05rem] md:text-[1.12rem]">
                {activeSlide.subtitle}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href={activeSlide.primaryCta.href}
                  className="public-button-primary inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold sm:min-w-[176px]"
                >
                  {activeSlide.primaryCta.label}
                </Link>
                <Link
                  href={activeSlide.secondaryCta.href}
                  className="public-button-secondary-light inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold sm:min-w-[176px]"
                >
                  {activeSlide.secondaryCta.label}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {partnerLogos.map((logo) => (
                  <div
                    key={logo.alt}
                    className="flex h-14 items-center justify-center rounded-[18px] border border-white/12 bg-[rgba(255,255,255,0.12)] px-4 shadow-[0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur-[2px]"
                  >
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      width={logo.width}
                      height={54}
                      className="h-9 w-auto object-contain sm:h-10"
                    />
                  </div>
                ))}
              </div>
            </div>

            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ duration: lightMotion ? 0 : 0.62, delay: lightMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="hidden pointer-events-auto lg:grid lg:gap-4"
            >
              <div className="public-hero-stat rounded-[26px] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffd08a]">
                  Visitor Journey
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--public-text-muted)]">
                  Trail context, schedule visibility, and sign-in guidance presented in one cinematic landing experience.
                </p>
              </div>
              <div className="public-hero-stat rounded-[26px] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffd08a]">
                  Current Focus
                </p>
                <p className="mt-3 text-[1.65rem] font-semibold tracking-[-0.04em] text-white">
                  {String(activeIndex + 1).padStart(2, "0")}
                </p>
                <div className="public-glow-divider mt-4" />
                <p className="mt-4 text-sm leading-7 text-[var(--public-text-muted)]">
                  Premium presentation with public information kept clear and uncluttered.
                </p>
              </div>
            </motion.aside>
          </motion.div>
        </div>

        <div className="absolute inset-x-0 bottom-5 z-20 mx-auto flex max-w-[1180px] items-end justify-between px-5 sm:bottom-6 sm:px-6 md:bottom-10 md:px-8">
          <div className="hidden rounded-full border border-white/10 bg-black/24 px-4 py-2 text-[11px] font-medium tracking-[0.16em] text-[var(--public-text-muted)] backdrop-blur-sm md:inline-flex">
            Public trail planning and sanctuary overview
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {slides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeIndex}
                className={`h-3 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-12 bg-[linear-gradient(90deg,#f97316_0%,#f5b342_100%)] shadow-[0_0_16px_rgba(249,115,22,0.32)]"
                    : "w-3 bg-white/40 hover:bg-white/58"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(HeroCarousel);
