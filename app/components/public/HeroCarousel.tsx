"use client";

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
      "An official public gateway for protected area information, biodiversity awareness, and sanctuary coordination.",
    primaryCta: {
      label: "About Us",
      href: "/about",
    },
    secondaryCta: {
      label: "Contact",
      href: "/contact",
    },
  },
  {
    image: "/images/carousel/carousel-02.jpg",
    title: "Protecting Biodiversity and Natural Heritage",
    subtitle:
      "Learn more about the sanctuary's ecological value, endemic species, and long-term conservation mission.",
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
    title: "Protected Area Information for the Public",
    subtitle:
      "Access public-facing information about sanctuary stewardship, management priorities, and environmental coordination.",
    primaryCta: {
      label: "About Us",
      href: "/about",
    },
    secondaryCta: {
      label: "Login",
      href: "/login",
    },
  },
  {
    image: "/images/carousel/carousel-04.jpg",
    title: "Conservation Through Partnership and Coordination",
    subtitle:
      "Connect with the sanctuary for services, institutional coordination, and protected area-related inquiries.",
    primaryCta: {
      label: "Contact",
      href: "/contact",
    },
    secondaryCta: {
      label: "About Us",
      href: "/about",
    },
  },
  {
    image: "/images/carousel/carousel-05.jpg",
    title: "Secure Internal Records Remain Separate",
    subtitle:
      "Public information is presented here, while authorized users can sign in to access secure internal records and protected tools.",
    primaryCta: {
      label: "Login",
      href: "/login",
    },
    secondaryCta: {
      label: "Contact",
      href: "/contact",
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
      <div className="relative min-h-[60vh] bg-[#0f241f] md:min-h-[74vh]">
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            aria-hidden={index !== activeIndex}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(11, 24, 21, 0.26) 0%, rgba(11, 24, 21, 0.54) 30%, rgba(11, 24, 21, 0.72) 64%, rgba(11, 24, 21, 0.88) 100%), url(${slide.image})`,
              backgroundColor: "#18352f",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          >
            {/* Replace the placeholder image files in public/images/carousel with your final carousel images. */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,232,216,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(43,81,67,0.20),transparent_32%),linear-gradient(90deg,rgba(11,24,21,0.34)_0%,rgba(11,24,21,0.08)_46%,rgba(11,24,21,0.18)_100%)]" />
          </div>
        ))}

        <div className="relative z-10 mx-auto flex min-h-[60vh] max-w-7xl items-end px-4 pb-14 pt-24 sm:px-6 sm:pb-16 sm:pt-26 md:min-h-[74vh] md:px-10 md:pb-20">
          <div className="max-w-3xl rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(16,33,29,0.34),rgba(16,33,29,0.12))] px-5 py-5 shadow-[0_28px_70px_rgba(0,0,0,0.18)] backdrop-blur-[3px] sm:px-6 sm:py-6 md:max-w-[52rem] md:rounded-[2.4rem] md:px-8 md:py-8">
            <h1 className="mt-3 leading-[1.05] tracking-[-0.02em] text-white md:mt-4 text-[2.1rem] sm:text-[2.8rem] md:text-[4.2rem] font-semibold">
              <span className="block">
                MT. HAMIGUITAN
              </span>
              <span className="block">
                {slides[activeIndex].title}
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-[0.94rem] leading-7 text-[#e6ebe7]/90 sm:text-[1rem] sm:leading-8 md:mt-4 md:max-w-3xl md:text-[1.12rem]">
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
          </div>
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
                    ? "w-10 bg-[#efe7d2]"
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
