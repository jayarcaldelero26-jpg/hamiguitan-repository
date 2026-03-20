import Link from "next/link";
import { Facebook, Mail, MapPin } from "lucide-react";
import PublicShell from "@/app/components/public/PublicShell";
import { Reveal, Stagger, StaggerItem } from "@/app/components/public/ScrollReveal";
import { PUBLIC_TREKKING_CONTACT } from "@/app/lib/publicContact";

const contactItems = [
  {
    label: "Email",
    value: PUBLIC_TREKKING_CONTACT.email,
    href: `mailto:${PUBLIC_TREKKING_CONTACT.email}`,
    icon: Mail,
  },
  {
    label: "Facebook Page",
    value: PUBLIC_TREKKING_CONTACT.facebookLabel,
    href: PUBLIC_TREKKING_CONTACT.facebookUrl,
    external: true,
    icon: Facebook,
  },
  {
    label: "Address",
    value: PUBLIC_TREKKING_CONTACT.address,
    icon: MapPin,
  },
];

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="public-section public-section-soft border-b border-[var(--public-border)]">
        <Reveal className="public-container max-w-[1120px] py-[48px] md:py-[80px]">
          <p className="public-eyebrow">Contact Us</p>
          <h1 className="public-h1 mt-[16px] max-w-4xl">
            Reach the Mt. Hamiguitan team for coordination, inquiries, and protected
            area-related support.
          </h1>
          <p className="public-body-lg mt-[24px] max-w-3xl">
            Reach the trekking office through the official DENR email, Facebook Page, or the
            listed government office address below.
          </p>
        </Reveal>
      </section>

      <section className="public-section public-section-light">
        <div className="public-container max-w-[1120px] py-[32px] md:py-[48px]">
          <Stagger className="grid gap-[24px] md:grid-cols-[1.05fr_0.95fr]">
            <StaggerItem>
              <article className="public-card public-panel-highlight p-[32px] md:p-[40px]">
                <h2 className="public-h3">Contact Information</h2>
                <p className="public-body mt-[16px] max-w-2xl">
                  Use the channels below for public coordination and institutional inquiries
                  related to Mt. Hamiguitan.
                </p>
                <div className="mt-[32px] grid gap-[16px]">
                  {contactItems.map((item) => (
                    <div key={item.label} className="public-card-soft public-hover-lift p-[20px]">
                      <div className="flex items-start gap-3">
                        <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--public-accent)]" />
                        <div className="min-w-0">
                          <p className="public-eyebrow tracking-[0.2em]">{item.label}</p>
                          {item.href ? (
                            <Link
                              href={item.href}
                              target={item.external ? "_blank" : undefined}
                              rel={item.external ? "noopener noreferrer" : undefined}
                              className="public-contact-link mt-[8px] inline-flex text-base leading-7"
                            >
                              {item.value}
                            </Link>
                          ) : (
                            <p className="mt-[8px] text-base leading-7 text-[var(--public-text)]">
                              {item.value}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </StaggerItem>

            <StaggerItem>
              <article className="public-card p-[32px] md:p-[40px]">
                <h2 className="public-h3">Coordination Notes</h2>
                <div className="public-body mt-[24px] space-y-[24px]">
                  <p>
                    Use email for formal trekking coordination and the official Facebook Page for
                    public updates and inquiries. Final booking and climb timing should still be
                    reviewed through the site&apos;s schedule and booking pages.
                  </p>
                  <div className="public-card-soft p-[20px]">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--public-accent)]" />
                      <div>
                        Office address:
                        <div className="mt-2 text-[var(--public-text)]">
                          {PUBLIC_TREKKING_CONTACT.address}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </StaggerItem>
          </Stagger>
        </div>
      </section>
    </PublicShell>
  );
}
