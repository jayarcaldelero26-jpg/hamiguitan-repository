import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import HeroCarousel from "@/app/components/public/HeroCarousel";
import PublicShell from "@/app/components/public/PublicShell";

const recognitions = [
  {
    src: "/images/branding/unesco-logo.png",
    alt: "UNESCO",
    title: "UNESCO World Heritage Site",
    detail: "Inscribed in 2014 for its exceptional biodiversity and habitats.",
  },
  {
    src: "/images/branding/asean-logo.png",
    alt: "ASEAN Heritage Parks",
    title: "ASEAN Heritage Park",
    detail: "Recognized for regional ecological importance and conservation value.",
  },
  {
    src: "/images/branding/denr-logo.png",
    alt: "Department of Environment and Natural Resources",
    title: "Republic Act No. 9303",
    detail: "Protected by Philippine law in 2004 as a wildlife sanctuary.",
  },
];

const keyFacts = [
  { label: "Protected Area", value: "6,349.01 ha" },
  { label: "Buffer Zone", value: "783.77 ha" },
  { label: "Recorded Species", value: "1,380+" },
  { label: "Endemic Species", value: "341" },
];

const features = [
  {
    title: "Protected Area Information",
    description:
      "View public information on sanctuary identity, legal protection, and management context.",
    icon: BookOpenIcon,
  },
  {
    title: "Conservation Knowledge",
    description:
      "Access concise material on biodiversity, endemic species, and ecological significance.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Coordination and Services",
    description:
      "Find the appropriate public channels for inquiries, coordination, and sanctuary-related communication.",
    icon: BuildingOffice2Icon,
  },
];

export default async function Home() {
  const cookieStore = await cookies();

  if (cookieStore.get("auth_token")) {
    redirect("/dashboard");
  }

  return (
    <PublicShell>
      <HeroCarousel />

      <section className="public-section public-section-light border-b border-[var(--public-border)]">
        <div className="public-container grid gap-[32px] md:grid-cols-[1.05fr_0.95fr] md:items-start">
          <div className="max-w-2xl">
            <p className="public-eyebrow">About Mount Hamiguitan</p>
            <h2 className="mt-[16px] text-[clamp(1.8rem,3vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--public-text)]">
              Mount Hamiguitan Range Wildlife Sanctuary is a protected mountain
              landscape in Davao Oriental recognized for biodiversity, unique
              ecosystems, and endemic species.
            </h2>
            <p className="public-body-lg mt-[24px] max-w-xl">
              MHRWS is a UNESCO World Heritage Site in the Philippines and an
              important conservation area that supports long-term protection of
              habitats, flora, and fauna found only in the region.
            </p>
          </div>

          <div className="public-card p-[28px] md:p-[32px]">
            <p className="public-eyebrow">Recognitions</p>
            <div className="mt-[20px] grid gap-[16px]">
              {recognitions.map((item) => (
                <div
                  key={item.title}
                  className="public-card-soft flex items-center gap-[16px] p-[18px]"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--public-border)] bg-white">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={72}
                      height={72}
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[1rem] font-semibold leading-6 text-[var(--public-text)]">
                      {item.title}
                    </h3>
                    <p className="public-body mt-[6px]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="public-section public-section-soft border-b border-[var(--public-border)]">
        <div className="public-container">
          <div className="max-w-2xl">
            <p className="public-eyebrow">Key Facts</p>
            <h2 className="mt-[16px] text-[clamp(1.8rem,3vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--public-text)]">
              Core figures that define the sanctuary and its ecological value.
            </h2>
          </div>

          <div className="mt-[40px] grid gap-[16px] sm:grid-cols-2 xl:grid-cols-4">
            {keyFacts.map((fact) => (
              <article key={fact.label} className="public-card p-[28px]">
                <p className="public-eyebrow">{fact.label}</p>
                <p className="mt-[18px] text-[2rem] font-semibold leading-none tracking-[-0.03em] text-[var(--public-text)]">
                  {fact.value}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section public-section-light border-b border-[var(--public-border)]">
        <div className="public-container">
          <div className="max-w-2xl">
            <p className="public-eyebrow">What You Can Access</p>
            <h2 className="mt-[16px] text-[clamp(1.8rem,3vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--public-text)]">
              Public information areas available through the Mt. Hamiguitan
              website.
            </h2>
            <p className="public-body-lg mt-[24px]">
              The site is organized around protected area reference,
              conservation knowledge, and public coordination.
            </p>
          </div>

          <div className="public-grid-feature mt-[48px]">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className="public-card flex flex-col p-[32px]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-[var(--public-border)] bg-[#edf2ec] text-[var(--public-primary)]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="my-auto pt-[24px]">
                    <h3 className="public-h3">{feature.title}</h3>
                    <p className="public-body mt-[16px]">{feature.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="public-section public-section-soft">
        <div className="public-container">
          <div className="public-card flex flex-col gap-[20px] p-[28px] md:flex-row md:items-center md:justify-between md:p-[32px]">
            <div className="max-w-2xl">
              <p className="public-eyebrow">Continue</p>
              <p className="public-body text-[var(--public-text)]">
                Learn more about Mount Hamiguitan, contact the sanctuary team,
                or sign in for authorized internal access.
              </p>
            </div>
            <div className="flex flex-wrap gap-[12px]">
              <Link
                href="/about"
                className="public-button-secondary-light inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold"
              >
                About Mount Hamiguitan
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="app-primary-button inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold"
              >
                Contact
              </Link>
              <Link
                href="/login"
                className="public-button-secondary-light inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
