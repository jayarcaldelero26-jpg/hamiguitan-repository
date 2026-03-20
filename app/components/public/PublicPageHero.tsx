import Image from "next/image";

const partnerLogos = [
  {
    src: "/images/branding/denr-logo.png",
    alt: "DENR logo",
    width: 48,
  },
  {
    src: "/images/branding/asean-logo.png",
    alt: "ASEAN Heritage Parks logo",
    width: 48,
  },
  {
    src: "/images/branding/unesco-logo.png",
    alt: "UNESCO logo",
    width: 48,
  },
] as const;

export default function PublicPageHero({
  eyebrow,
  title,
  description,
  image,
  badges = [],
  showPartnerLogos = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  badges?: string[];
  showPartnerLogos?: boolean;
}) {
  return (
    <section className="public-section public-section-soft border-b border-[var(--public-border)]">
      <div className="public-container max-w-[1180px]">
        <div className="relative overflow-hidden rounded-[34px] border border-[var(--public-border)] bg-[#081019]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(5, 7, 11, 0.18) 0%, rgba(5, 7, 11, 0.34) 38%, rgba(5, 7, 11, 0.62) 100%), url(${image})`,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(249,115,22,0.12),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.08),transparent_20%),linear-gradient(90deg,rgba(5,7,11,0.58)_0%,rgba(5,7,11,0.2)_42%,rgba(5,7,11,0.6)_100%)]" />

          <div className="relative z-[1] px-5 py-12 sm:px-7 md:px-10 md:py-16">
            <div className="max-w-4xl rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,17,27,0.66),rgba(7,10,16,0.46))] p-6 shadow-[0_16px_42px_rgba(0,0,0,0.22)] backdrop-blur-[6px] md:p-8">
              <p className="public-eyebrow">{eyebrow}</p>
              <h1 className="public-h1 mt-[16px] max-w-4xl">{title}</h1>
              <p className="public-body-lg mt-[22px] max-w-3xl">{description}</p>

              {badges.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {badges.map((badge) => (
                    <div
                      key={badge}
                      className="public-card-soft px-4 py-3 text-sm font-medium text-[var(--public-text)]"
                    >
                      {badge}
                    </div>
                  ))}
                </div>
              ) : null}

              {showPartnerLogos ? (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {partnerLogos.map((logo) => (
                    <div
                      key={logo.alt}
                      className="flex h-14 items-center justify-center rounded-[18px] border border-white/12 bg-[rgba(255,255,255,0.12)] px-4 shadow-[0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur-[2px]"
                    >
                      <Image
                        src={logo.src}
                        alt={logo.alt}
                        width={logo.width}
                        height={48}
                        className="h-9 w-auto object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
