import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  MapIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Facebook, Mail, MapPin } from "lucide-react";
import PublicShell from "@/app/components/public/PublicShell";
import PublicAuthRedirectGate from "@/app/components/public/PublicAuthRedirectGate";
import { Reveal, Stagger, StaggerItem } from "@/app/components/public/ScrollReveal";
import { PUBLIC_TREKKING_CONTACT } from "@/app/lib/publicContact";
import { listLatestPublicMinutesAndResolutions } from "@/app/lib/publicDocuments";

const HeroCarousel = dynamic(() => import("@/app/components/public/HeroCarousel"));
const LatestPublicDocumentsShowcase = dynamic(
  () => import("@/app/components/public/LatestPublicDocumentsShowcase")
);

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
  "A public site that combines sanctuary information, trail preview, public schedule visibility, and sign-in guidance.",
  "Designed to help visitors prepare more clearly without turning the homepage into a dashboard.",
];

const trailCards = [
  {
    title: "San Isidro Trail",
    badge: "Main trail",
    description:
      "One of the sanctuary's two main public trail options, offering a structured route into Mount Hamiguitan's signature forest and summit environment.",
  },
  {
    title: "Governor Generoso Trail",
    badge: "Main trail",
    description:
      "One of the sanctuary's two main public trail options for visitors planning around route preference, trip coordination, and schedule visibility.",
  },
];

const scheduleItems = [
  "Check trail-based climb dates before committing to a trip.",
  "Use the public schedule as a planning tool, not just a booking checkpoint.",
  "Get a clearer sense of timing for requirements and coordination.",
];

const bookingSteps = [
  "Choose a trail that fits your plan.",
  "Review available schedule dates.",
  "Prepare and submit the required details.",
  "Wait for confirmation before finalizing the climb.",
];

export default async function Home() {
  const latestPublicDocuments = await listLatestPublicMinutesAndResolutions();

  return (
    <PublicShell>
      <PublicAuthRedirectGate />
      <HeroCarousel />

      <section className="border-b border-[var(--public-border)] bg-[linear-gradient(180deg,rgba(8,11,18,0.92)_0%,rgba(10,15,22,0.98)_100%)]">
        <div className="public-container py-[24px] md:py-[34px]">
          <Stagger className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {highlightItems.map((item) => (
              <StaggerItem key={item.title}>
                <article className="public-card-soft public-hover-lift rounded-[24px] p-5">
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
              A public homepage for sanctuary identity, trail planning, schedule visibility, and visitor coordination.
            </h2>
            <p className="public-body-lg mt-[22px]">
              Mount Hamiguitan Range Wildlife Sanctuary is more than a booking destination. It is a protected landscape, a World Heritage site, and a public gateway for understanding how visitors can prepare for the mountain responsibly.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                "Protected mountain landscape",
                "Two main public trails",
                "Read-only schedule visibility",
              ].map((item) => (
                <div key={item} className="public-card-soft p-4 text-sm font-medium text-[var(--public-text)]">
                  {item}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <article className="public-card public-panel-highlight p-[28px] md:p-[32px]">
              <p className="public-eyebrow">What The Site Helps You Do</p>
              <Stagger className="mt-[20px] space-y-3" staggerChildren={0.08} amount={0.18}>
              {overviewPoints.map((point) => (
                <StaggerItem key={point}>
                  <div className="public-card-soft flex gap-3 p-4">
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
                <article className="public-card public-spotlight-card public-hover-lift relative overflow-hidden p-[28px] md:p-[34px]">
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.22)_0%,transparent_70%)]" />
                  <div className="relative">
                    <span className="inline-flex rounded-full border border-[rgba(245,158,11,0.18)] bg-[rgba(245,158,11,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--public-accent)]">
                      {trail.badge}
                    </span>
                    <h3 className="mt-5 text-[2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--public-text)]">
                      {trail.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-[1rem] leading-8 text-[var(--public-text-muted)]">
                      {trail.description}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <div className="public-card-soft px-4 py-3 text-sm leading-7 text-[var(--public-text-muted)]">
                        Public-facing trail overview with schedule-first planning.
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href="/about"
                        className="public-button-secondary-light inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold"
                      >
                        Learn More
                      </Link>
                      <Link
                        href="/schedule"
                        className="public-inline-link inline-flex min-h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold"
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
            <div className="public-card-soft flex h-12 w-12 items-center justify-center rounded-[16px] text-[var(--public-accent)]">
              <CalendarDaysIcon className="h-6 w-6" />
            </div>
            <p className="public-eyebrow mt-6">Climb Schedule Preview</p>
            <h2 className="public-h3 mt-4">
              Use the public schedule to understand timing and trail occupancy before moving into the trekking workflow.
            </h2>
            <div className="mt-5 space-y-3">
              {scheduleItems.map((item) => (
                <div
                  key={item}
                  className="public-card-soft px-4 py-3 text-sm leading-7 text-[var(--public-text-muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/schedule"
              className="public-button-secondary-light mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold"
            >
              View Public Schedule
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            </article>
          </StaggerItem>

          <StaggerItem>
            <article className="public-card public-panel-highlight public-spotlight-card p-[28px] text-white md:p-[34px]">
            <div className="public-card-soft flex h-12 w-12 items-center justify-center rounded-[16px] text-[var(--public-accent)]">
              <MapIcon className="h-6 w-6" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--public-accent)]">
              Booking Preview
            </p>
            <h2 className="mt-4 text-[1.8rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
              Trekking coordination now starts with trails, public schedule visibility, and sign-in guidance.
            </h2>
            <div className="mt-6 grid gap-3">
              {bookingSteps.map((step, index) => (
                <div
                  key={step}
                  className="public-card-soft p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--public-accent)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--public-text-muted)]">{step}</p>
                </div>
              ))}
            </div>
            <Link
              href="/login"
              className="public-button-primary mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold"
            >
              Sign In
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
                <article className="public-card public-hover-lift p-6">
                <div className="public-card-soft flex h-12 w-12 items-center justify-center rounded-[16px] text-[var(--public-accent)]">
                  <PhoneIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-[1.15rem] font-semibold text-[var(--public-text)]">
                  Contact And Coordination
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--public-text-muted)]">
                  Reach the trekking team through the official DENR email, Facebook Page, and office
                  address listed on the contact page.
                </p>
                <div className="mt-3 grid gap-2 text-sm">
                  <Link
                    href={`mailto:${PUBLIC_TREKKING_CONTACT.email}`}
                    className="public-contact-link inline-flex w-fit items-start gap-2"
                  >
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
                  <div className="inline-flex items-start gap-2 text-[var(--public-text-muted)]">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--public-accent)]" />
                    <span>{PUBLIC_TREKKING_CONTACT.address}</span>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="public-button-secondary-light mt-5 inline-flex min-h-12 items-center justify-center rounded-full px-5 font-semibold"
                >
                  Contact Us
                </Link>
                </article>
              </StaggerItem>

              <StaggerItem>
                <article className="public-card public-hover-lift p-6">
                <div className="public-card-soft flex h-12 w-12 items-center justify-center rounded-[16px] text-[var(--public-accent)]">
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

      <section className="public-section public-section-light border-b border-[var(--public-border)]">
        <div className="public-container">
          <div className="grid gap-8">
            <Reveal className="max-w-3xl">
              <p className="public-eyebrow">Latest Uploads</p>
              <h2 className="public-h2 mt-[16px]">
                Latest Minutes and Resolutions
              </h2>
              <p className="public-body-lg mt-[22px]">
                A public-safe snapshot of the latest uploaded Minutes and Resolutions using only
                summary metadata already stored in the system.
              </p>
            </Reveal>
          </div>
          <div className="mt-8">
            <LatestPublicDocumentsShowcase documents={latestPublicDocuments} />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
