import PublicShell from "@/app/components/public/PublicShell";

const keyFacts = [
  { label: "Protected Area", value: "6,349.01 ha" },
  { label: "Buffer Zone", value: "783.77 ha" },
  { label: "Recorded Species", value: "1,380+" },
  { label: "Endemic Species", value: "341" },
];

const notableSpecies = [
  {
    title: "Philippine Eagle",
    detail:
      "A critically endangered raptor associated with mature forest habitats and one of the country's most important flagship species.",
  },
  {
    title: "Nepenthes hamiguitanensis",
    detail:
      "An endemic pitcher plant linked to the sanctuary's highly specialized montane ecosystems.",
  },
  {
    title: "Montane Endemics",
    detail:
      "Flora and fauna adapted to mossy forest, cloud forest, and pygmy forest conditions found within Mount Hamiguitan.",
  },
];

const rainforestBlocks = [
  {
    title: "Cloud Forest Habitats",
    body: [
      "The montane and mossy forests of MHRWS, commonly referred to as cloud forests, serve as vital habitats for numerous rare and endemic species. These include the critically endangered Philippine eagle (Pithecophaga jefferyi), the Philippine cockatoo (Cacatua haematuropygia), and the endemic pitcher plant (Nepenthes hamiguitanensis), found exclusively within the sanctuary.",
      "These ecosystems are characterized by stunted, moss-covered trees, abundant epiphytes, and a cool, humid microclimate that supports highly specialized ecological interactions.",
    ],
  },
  {
    title: "The Pygmy Forest",
    body: [
      "One of the sanctuary's most remarkable features is the Pygmy Forest, also known as the Bonsai Forest, an extreme form of upper montane rainforest where centuries-old trees grow only a few feet tall due to nutrient-poor soils and harsh climatic conditions.",
      "This rare ecological formation makes Mount Hamiguitan an important natural laboratory for studying resilience, adaptation, and long-term ecosystem dynamics.",
    ],
    highlighted: true,
  },
];

const challengeBlocks = [
  {
    title: "Environmental Pressure",
    detail:
      "Despite its protected status, MHRWS continues to face threats from climate change, illegal logging, and land conversion.",
  },
  {
    title: "Science-Based Protection",
    detail:
      "Sustained conservation action is needed to safeguard ecological integrity and maintain water regulation, carbon sequestration, and climate resilience.",
  },
];

export default function AboutPage() {
  return (
    <PublicShell>
      <section className="public-section public-section-soft border-b border-[var(--public-border)]">
        <div className="public-container max-w-[1120px] py-[48px] md:py-[80px]">
          <p className="public-eyebrow">About Mount Hamiguitan</p>
          <h1 className="public-h1 mt-[16px] max-w-4xl">
            A protected mountain range in Davao Oriental recognized for
            exceptional biodiversity, endemic life, and long-term conservation
            significance.
          </h1>
          <p className="public-body-lg mt-[24px] max-w-3xl">
            Mount Hamiguitan Range Wildlife Sanctuary is a UNESCO World
            Heritage Site and protected area that preserves one of the
            Philippines&apos; most important montane ecosystems. Its value lies
            not only in species richness, but in the ecological processes and
            rare habitats that continue to endure within the sanctuary.
          </p>
        </div>
      </section>

      <section className="public-section public-section-light border-b border-[var(--public-border)]">
        <div className="public-container max-w-[1120px]">
          <div className="grid gap-[24px] md:grid-cols-[1.08fr_0.92fr]">
            <article className="public-card p-[32px] md:p-[40px]">
              <p className="public-eyebrow">Overview / Identity</p>
              <h2 className="public-h3 mt-[18px]">
                A globally recognized protected landscape with scientific and
                public significance.
              </h2>
              <p className="public-body mt-[18px]">
                The sanctuary covers 6,349.01 hectares with an additional
                783.77-hectare buffer zone. It is recognized for high endemism,
                habitat diversity, and the presence of ecological systems of
                national and global conservation concern.
              </p>
              <p className="public-body mt-[14px]">
                For public audiences, Mount Hamiguitan represents both a natural
                heritage site and a living conservation landscape whose
                protection supports long-term ecological stability in Mindanao.
              </p>
            </article>

            <aside className="public-card p-[28px] md:p-[32px]">
              <p className="public-eyebrow">Key Facts</p>
              <div className="mt-[20px] grid gap-[14px] sm:grid-cols-2">
                {keyFacts.map((fact) => (
                  <div key={fact.label} className="public-card-soft p-[18px]">
                    <p className="public-eyebrow">{fact.label}</p>
                    <p className="mt-[14px] text-[1.7rem] font-semibold leading-none tracking-[-0.03em] text-[var(--public-text)]">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="public-section public-section-soft border-b border-[var(--public-border)]">
        <div className="public-container max-w-[1120px]">
          <div className="grid gap-[24px] md:grid-cols-[0.92fr_1.08fr]">
            <article className="public-card p-[32px] md:p-[40px]">
              <p className="public-eyebrow">Historical Background</p>
              <p className="public-body mt-[20px]">
                Mount Hamiguitan Range Wildlife Sanctuary was established under
                Republic Act No. 9303 in 2004, creating a legal framework for
                the protection of its habitats and species.
              </p>
              <p className="public-body mt-[14px]">
                Its later designation as an ASEAN Heritage Park and inscription
                as a UNESCO World Heritage Site in 2014 expanded recognition of
                the sanctuary&apos;s ecological value beyond the national level.
              </p>
            </article>

            <article className="public-card p-[32px] md:p-[40px]">
              <p className="public-eyebrow">Ecological Significance</p>
              <h2 className="public-h3 mt-[18px]">
                A sanctuary defined by habitat diversity, endemism, and rare
                ecological formations.
              </h2>
              <p className="public-body mt-[18px]">
                The protected area contains lowland and montane forest
                ecosystems, mossy forest, and the distinctive pygmy forest
                associated with Mount Hamiguitan. These habitats support more
                than 1,380 recorded species, including at least 341 endemic
                species.
              </p>
              <div className="public-card-soft mt-[20px] p-[20px]">
                <p className="text-[0.98rem] leading-7 text-[var(--public-text)]">
                  Its ecological range and concentration of endemic life make
                  Mount Hamiguitan one of the most important biodiversity sites
                  in the Philippines and an enduring reference point for
                  conservation science.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="public-section public-section-light border-b border-[var(--public-border)]">
        <div className="public-container max-w-[1120px]">
          <div className="max-w-3xl">
            <p className="public-eyebrow">Tropical Upper Montane Rainforest</p>
            <h2 className="public-h2 mt-[16px]">
              A high-elevation rainforest system shaped by biodiversity,
              endemism, and adaptation to extreme environmental conditions.
            </h2>
            <p className="public-body-lg mt-[20px] max-w-3xl">
              The tropical upper montane rainforest of the Mount Hamiguitan
              Range Wildlife Sanctuary is a globally significant ecosystem
              recognized for exceptional biodiversity and ecological stability.
              As a UNESCO World Heritage Site, the sanctuary preserves one of
              the most intact montane ecosystems in the Philippines.
            </p>
          </div>

          <div className="mt-[32px] grid gap-[20px] md:grid-cols-2 md:gap-[24px]">
            {rainforestBlocks.map((block) => (
              <article
                key={block.title}
                className={`public-card p-[24px] sm:p-[28px] md:p-[32px] ${
                  block.highlighted
                    ? "border-[#cbd9cb] bg-[linear-gradient(180deg,#ffffff_0%,#f5f6f0_100%)]"
                    : ""
                }`}
              >
                <h3 className="public-h3">{block.title}</h3>
                <div className="mt-[18px] space-y-[14px]">
                  {block.body.map((paragraph) => (
                    <p key={paragraph} className="public-body">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section public-section-soft border-b border-[var(--public-border)]">
        <div className="public-container max-w-[1120px]">
          <div className="grid gap-[24px] md:grid-cols-[0.9fr_1.1fr]">
            <article className="public-card p-[32px] md:p-[40px]">
              <p className="public-eyebrow">Notable Species</p>
              <div className="mt-[20px] space-y-[12px]">
                {notableSpecies.map((species) => (
                  <div key={species.title} className="public-card-soft p-[18px]">
                    <h3 className="text-[1rem] font-semibold leading-6 text-[var(--public-text)]">
                      {species.title}
                    </h3>
                    <p className="public-body mt-[8px]">{species.detail}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="public-card p-[32px] md:p-[40px]">
              <p className="public-eyebrow">Conservation Challenges</p>
              <div className="mt-[20px] grid gap-[14px]">
                {challengeBlocks.map((block) => (
                  <div key={block.title} className="public-card-soft p-[20px]">
                    <h3 className="text-[1rem] font-semibold leading-6 text-[var(--public-text)]">
                      {block.title}
                    </h3>
                    <p className="public-body mt-[8px]">{block.detail}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="public-section public-section-light border-b border-[var(--public-border)]">
        <div className="public-container max-w-[1120px]">
          <article className="public-card p-[32px] md:p-[40px]">
            <p className="public-eyebrow">Conservation And Tourism</p>
            <p className="public-body mt-[20px] max-w-4xl">
              Conservation management in Mount Hamiguitan focuses on habitat
              protection, biodiversity monitoring, protected area governance,
              and coordination with partner institutions and local communities.
              Public visitation and tourism must remain consistent with
              conservation priorities, site protection measures, and the
              long-term ecological integrity of the sanctuary.
            </p>
          </article>
        </div>
      </section>

      <section className="public-section public-section-soft">
        <div className="public-container max-w-[1120px]">
          <article className="public-card p-[32px] md:p-[40px]">
            <p className="public-eyebrow">Institutional Note</p>
            <p className="mt-[18px] text-[1.08rem] leading-8 text-[var(--public-text)]">
              Mount Hamiguitan is both a scientific priority and a public trust.
              Its continued protection supports biodiversity conservation,
              environmental stability, and the long-term stewardship of one of
              the Philippines&apos; most significant natural heritage landscapes.
            </p>
          </article>
        </div>
      </section>
    </PublicShell>
  );
}
