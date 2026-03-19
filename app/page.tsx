import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  MapIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import HeroCarousel from "@/app/components/public/HeroCarousel";
import PublicShell from "@/app/components/public/PublicShell";
import { Reveal, Stagger, StaggerItem } from "@/app/components/public/ScrollReveal";

const highlightItems = [
  {
    title: "UNESCO World Heritage Site",
    detail: "Recognized for exceptional biodiversity, endemic life, and rare montane habitats.",
  },
  {
    title: "Trail-Based Visitor Access",
    detail: "Explore route options before planning your climb through the protected area.",
  },
  {
    title: "Schedule Visibility",
    detail: "Review climb timing through the site before preparing requirements and travel.",
  },
  {
    title: "Public Coordination",
    detail: "Use the website for contact access, trail context, and booking guidance in one place.",
  },
];

const overviewPoints = [
  "A protected mountain landscape in Davao Oriental with globally important biodiversity.",
  "A public site that combines sanctuary information, trail preview, climb scheduling, and booking access.",
  "Designed to help visitors prepare more clearly without turning the homepage into a dashboard.",
];

const trailCards = [
  {
    title: "San Isidro Trail",
    badge: "Main route",
    description:
      "A strong public starting point for climbers seeking a structured route into Mount Hamiguitan's signature forest and summit environment.",
  },
  {
    title: "Governor Generoso Trail",
    badge: "Alternate route",
    description:
      "A second trail option for visitors planning around route preference, trip coordination, and schedule availability.",
  },
];

const scheduleItems = [
  "Check trail-based climb dates before committing to a trip.",
  "Use the calendar as a planning tool, not just a booking checkpoint.",
  "Get a clearer sense of timing for requirements and coordination.",
];

const bookingSteps = [
  "Choose a trail that fits your plan.",
  "Review available schedule dates.",
  "Prepare and submit the required details.",
  "Wait for confirmation before finalizing the climb.",
];

export default async function Home() {
  const cookieStore = await cookies();

  if (cookieStore.get("auth_token")) {
    redirect("/dashboard");
  }

  return (
    <PublicShell>
      <HeroCarousel />

      <section className="border-b border-[var(--public-border)] bg-[linear-gradient(180deg,#f6f3eb_0%,#f1ede4_100%)]">
        <div className="public-container py-[24px] md:py-[34px]">
          <Stagger className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {highlightItems.map((item) => (
              <StaggerItem key={item.title}>
                <article className="rounded-[24px] border border-[#d8ddd2] bg-white/78 p-5 shadow-[0_14px_34px_rgba(20,39,32,0.06)] backdrop-blur-sm">
                  <p className="text-[0.88rem] font-semibold leading-6 text-[var(--public-text)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--public-text-muted)]">
                    {item.detail}
                  </p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="public-section public-section-light border-b border-[var(--public-border)]">
        <div className="public-container grid gap-[28px] lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <Reveal className="max-w-2xl">
            <p className="public-eyebrow">Mount Hamiguitan Overview</p>
            <h2 className="public-h2 mt-[16px]">
              A public homepage for sanctuary identity, trail planning, climb scheduling, and visitor coordination.
            </h2>
            <p className="public-body-lg mt-[22px]">
              Mount Hamiguitan Range Wildlife Sanctuary is more than a booking destination. It is a protected landscape, a World Heritage site, and a public gateway for understanding how visitors can prepare for the mountain responsibly.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <article className="public-card p-[28px] md:p-[32px]">
              <p className="public-eyebrow">What The Site Helps You Do</p>
              <Stagger className="mt-[20px] space-y-3" staggerChildren={0.08} amount={0.18}>
              {overviewPoints.map((point) => (
                <StaggerItem key={point}>
                  <div className="flex gap-3 rounded-[22px] border border-[#dce3d9] bg-[#f6f7f2] p-4">
                    <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--public-primary)]" />
                    <p className="text-sm leading-7 text-[var(--public-text-muted)]">{point}</p>
                  </div>
                </StaggerItem>
              ))}
              </Stagger>
            </article>
          </Reveal>
        </div>
      </section>

      <section
        id="trail-highlights"
        className="public-section public-section-soft border-b border-[var(--public-border)]"
      >
        <div className="public-container">
          <Reveal className="max-w-2xl">
            <p className="public-eyebrow">Trail Information Preview</p>
            <h2 className="public-h2 mt-[16px]">
              Start with the route and the mountain experience, then move into timing and logistics.
            </h2>
          </Reveal>

          <Stagger className="mt-[42px] grid gap-6 lg:grid-cols-2" staggerChildren={0.12}>
            {trailCards.map((trail) => (
              <StaggerItem key={trail.title}>
                <article className="relative overflow-hidden rounded-[32px] border border-[#d8ddd2] bg-[linear-gradient(180deg,#ffffff_0%,#f5f4ee_100%)] p-[28px] shadow-[0_22px_54px_rgba(20,39,32,0.08)] transition duration-300 hover:-translate-y-[2px] hover:shadow-[0_28px_70px_rgba(20,39,32,0.12)] md:p-[34px]">
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(125,151,132,0.18)_0%,transparent_70%)]" />
                  <div className="relative">
                    <span className="inline-flex rounded-full border border-[var(--ui-border)] bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-accent-soft)]">
                      {trail.badge}
                    </span>
                    <h3 className="mt-5 text-[2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--public-text)]">
                      {trail.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-[1rem] leading-8 text-[var(--public-text-muted)]">
                      {trail.description}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link
                        href="/about"
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--ui-border)] bg-white/[0.08] px-5 text-sm font-semibold text-[var(--ui-text-main)] shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition hover:-translate-y-[1px] hover:border-[var(--ui-border-strong)]"
                      >
                        Learn More
                      </Link>
                      <Link
                        href="/calendar"
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold text-[var(--ui-text-soft)] transition hover:text-[var(--ui-text-main)]"
                      >
                        View Schedule
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="public-section public-section-light border-b border-[var(--public-border)]">
        <Stagger className="public-container grid gap-6 lg:grid-cols-[1fr_1fr]" staggerChildren={0.12}>
          <StaggerItem>
            <article className="public-card p-[28px] md:p-[34px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/[0.08] text-[var(--ui-accent-soft)]">
              <CalendarDaysIcon className="h-6 w-6" />
            </div>
            <p className="public-eyebrow mt-6">Climb Schedule Preview</p>
            <h2 className="public-h3 mt-4">
              Use the calendar to understand timing before moving into the booking flow.
            </h2>
            <div className="mt-5 space-y-3">
              {scheduleItems.map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-[#dce3d9] bg-[#f7f8f3] px-4 py-3 text-sm leading-7 text-[var(--public-text-muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/calendar"
              className="public-button-secondary-light mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold"
            >
              View Climb Schedule
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            </article>
          </StaggerItem>

          <StaggerItem>
            <article className="rounded-[32px] border border-[var(--ui-border)] bg-[linear-gradient(135deg,#1F2A33_0%,#24313B_48%,#181F27_100%)] p-[28px] text-white shadow-[0_24px_70px_rgba(0,0,0,0.26)] md:p-[34px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/10 text-[#d8e7dc] backdrop-blur-sm">
              <MapIcon className="h-6 w-6" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#bdd1c5]">
              Booking Preview
            </p>
            <h2 className="mt-4 text-[1.8rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
              Booking stays available, but it now sits within a broader visitor journey.
            </h2>
            <div className="mt-6 grid gap-3">
              {bookingSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-[22px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bdd1c5]">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#d9e5de]">{step}</p>
                </div>
              ))}
            </div>
            <Link
              href="/booking"
              className="app-primary-button mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold"
            >
              Book Now
            </Link>
            </article>
          </StaggerItem>
        </Stagger>
      </section>

      <section className="public-section public-section-soft border-b border-[var(--public-border)]">
        <div className="public-container">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <Reveal className="max-w-2xl">
              <p className="public-eyebrow">Connect With The Sanctuary</p>
              <h2 className="public-h2 mt-[16px]">
                Keep contact and coordination visible on the homepage, not buried behind a conversion-first layout.
              </h2>
              <p className="public-body-lg mt-[22px]">
                Visitors often need context as much as action. The public homepage should still guide people toward the sanctuary team, protected area information, and the next relevant page.
              </p>
            </Reveal>

            <Stagger className="grid gap-4 md:grid-cols-2" staggerChildren={0.1}>
              <StaggerItem>
                <article className="public-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/[0.08] text-[var(--ui-accent-soft)]">
                  <PhoneIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-[1.15rem] font-semibold text-[var(--public-text)]">
                  Contact And Coordination
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--public-text-muted)]">
                  Reach the public-facing contact page for inquiries, office coordination, and sanctuary-related communication.
                </p>
                <Link
                  href="/contact"
                  className="public-button-secondary-light mt-5 inline-flex min-h-12 items-center justify-center rounded-full px-5 font-semibold"
                >
                  Contact Us
                </Link>
                </article>
              </StaggerItem>

              <StaggerItem>
                <article className="public-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/[0.08] text-[var(--ui-accent-soft)]">
                  <ShieldCheckIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-[1.15rem] font-semibold text-[var(--public-text)]">
                  Learn About The Site
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--public-text-muted)]">
                  Read more about the sanctuary&apos;s ecological value, legal protection, and public significance before planning a climb.
                </p>
                <Link
                  href="/about"
                  className="public-button-secondary-light mt-5 inline-flex min-h-12 items-center justify-center rounded-full px-5 font-semibold"
                >
                  About Mount Hamiguitan
                </Link>
                </article>
              </StaggerItem>
            </Stagger>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
