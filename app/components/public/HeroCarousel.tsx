"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
      href: "/calendar",
    },
  },
  {
    image: "/images/carousel/carousel-04.jpg",
    title: "Schedule And Climb Preparation",
    subtitle:
      "Use the public calendar and booking preview to understand climb timing, requirements, and next steps more clearly.",
    primaryCta: {
      label: "View Schedule",
      href: "/calendar",
    },
    secondaryCta: {
      label: "Book Now",
      href: "/booking",
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
      label: "Login",
      href: "/login",
    },
  },
];

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [touchPaused, setTouchPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const pointerActiveRef = useRef(false);

  const isPaused = hoverPaused || touchPaused;

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused]);

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
      onTouchStart={() => setTouchPaused(true)}
      onTouchEnd={() => setTouchPaused(false)}
      onPointerDown={(event) => handlePointerStart(event.clientX)}
      onPointerUp={(event) => handlePointerEnd(event.clientX)}
      onPointerCancel={resetPointerTracking}
      onPointerLeave={() => {
        if (pointerActiveRef.current) {
          resetPointerTracking();
        }
      }}
    >
      <div className="relative min-h-[60vh] bg-[#181f27] md:min-h-[74vh]">
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            aria-hidden={index !== activeIndex}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(24, 31, 39, 0.28) 0%, rgba(24, 31, 39, 0.58) 30%, rgba(24, 31, 39, 0.76) 64%, rgba(24, 31, 39, 0.92) 100%), url(${slide.image})`,
              backgroundColor: "#1f2a33",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          >
            {/* Replace the placeholder image files in public/images/carousel with your final carousel images. */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(134,140,101,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(57,92,122,0.18),transparent_32%),linear-gradient(90deg,rgba(24,31,39,0.34)_0%,rgba(24,31,39,0.08)_46%,rgba(24,31,39,0.18)_100%)]" />
          </div>
        ))}

        <div className="relative z-10 mx-auto flex min-h-[60vh] max-w-7xl items-end px-4 pb-14 pt-24 sm:px-6 sm:pb-16 sm:pt-26 md:min-h-[74vh] md:px-10 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl rounded-[2rem] border border-[var(--ui-border)] bg-[linear-gradient(180deg,rgba(31,42,51,0.46),rgba(24,31,39,0.22))] px-5 py-5 shadow-[0_28px_70px_rgba(0,0,0,0.22)] backdrop-blur-[3px] sm:px-6 sm:py-6 md:max-w-[52rem] md:rounded-[2.4rem] md:px-8 md:py-8"
          >
            <h1 className="mt-3 leading-[1.05] tracking-[-0.02em] text-white md:mt-4 text-[2.1rem] sm:text-[2.8rem] md:text-[4.2rem] font-semibold">
              <span className="block">
                MT. HAMIGUITAN
              </span>
              <span className="block">
                {slides[activeIndex].title}
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-[0.94rem] leading-7 text-[color:rgba(230,237,243,0.9)] sm:text-[1rem] sm:leading-8 md:mt-4 md:max-w-3xl md:text-[1.12rem]">
              {slides[activeIndex].subtitle}
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Link
                href={slides[activeIndex].primaryCta.href}
                className="app-primary-button inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold sm:min-w-[168px]"
              >
                {slides[activeIndex].primaryCta.label}
              </Link>
              <Link
                href={slides[activeIndex].secondaryCta.href}
                className="app-secondary-button inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold sm:min-w-[168px]"
              >
                {slides[activeIndex].secondaryCta.label}
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="absolute inset-x-0 bottom-5 z-20 mx-auto flex max-w-7xl items-end px-4 sm:bottom-6 sm:px-6 md:bottom-10 md:px-10">
          <div className="flex items-center gap-2 sm:gap-3">
            {slides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeIndex}
                className={`h-3 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-10 bg-[#868c65]"
                    : "w-3 bg-white/42 hover:bg-white/68"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
