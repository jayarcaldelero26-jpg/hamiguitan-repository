import PublicShell from "@/app/components/public/PublicShell";

const notableSpecies = [
  "Philippine eagle and other threatened birds associated with forest habitats",
  "Nepenthes hamiguitanensis and other pitcher plants found in unique summit ecosystems",
  "Endemic flora and fauna adapted to the sanctuary's mossy forests and pygmy forest formations",
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
  },
  {
    title: "Conservation Challenges",
    body: [
      "Despite its protected status, MHRWS continues to face threats from climate change, illegal logging, and land conversion.",
      "Sustained and science-based conservation efforts are therefore essential to safeguard its ecological integrity and ensure the continued provision of critical ecosystem services, including water regulation, carbon sequestration, and climate resilience.",
    ],
  },
  {
    title: "Ecological Importance",
    body: [
      "The tropical montane rainforest of Mount Hamiguitan represents an invaluable natural heritage.",
      "Its protection is essential not only for the conservation of biodiversity but also for the long-term environmental stability of Mindanao and the Philippines as a whole.",
    ],
  },
];

export default function AboutPage() {
  return (
    <PublicShell>
      <section className="public-section public-section-soft border-b border-[var(--public-border)]">
        <div className="public-container max-w-[1120px] py-[48px] md:py-[80px]">
          <p className="public-eyebrow">About Mount Hamiguitan</p>
          <h1 className="public-h1 mt-[16px] max-w-4xl">
            A protected mountain range in Davao Oriental recognized for its
            biodiversity, endemic species, and long-standing conservation
            importance.
          </h1>
          <p className="public-body-lg mt-[24px] max-w-3xl">
            Mount Hamiguitan Range Wildlife Sanctuary is a UNESCO World Heritage
            Site and protected area established to conserve habitats, species,
            and ecological systems of national and global significance.
          </p>
        </div>
      </section>

      <section className="public-section public-section-light border-b border-[var(--public-border)]">
        <div className="public-container max-w-[1120px]">
          <div className="public-grid-2">
            <article className="public-card p-[32px] md:p-[40px]">
              <p className="public-eyebrow">Overview</p>
              <p className="public-body mt-[20px]">
                Mount Hamiguitan Range Wildlife Sanctuary covers 6,349.01
                hectares with an additional 783.77-hectare buffer zone. It is
                recognized for exceptional habitat diversity, high endemism, and
                the presence of species and ecosystems of major conservation
                concern.
              </p>
            </article>

            <article className="public-card p-[32px] md:p-[40px]">
              <p className="public-eyebrow">Historical Background</p>
              <p className="public-body mt-[20px]">
                The sanctuary was established under Republic Act No. 9303 in
                2004. It later gained wider international recognition through
                its designation as an ASEAN Heritage Park and its inscription as
                a UNESCO World Heritage Site in 2014.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="public-section public-section-soft border-b border-[var(--public-border)]">
        <div className="public-container max-w-[1120px]">
          <div className="grid gap-[24px] md:grid-cols-[1.05fr_0.95fr]">
            <article className="public-card p-[32px] md:p-[40px]">
              <p className="public-eyebrow">Description And Significance</p>
              <p className="public-body mt-[20px]">
                The sanctuary contains lowland and montane forest ecosystems,
                mossy forest, and the distinctive pygmy forest associated with
                Mount Hamiguitan. These habitats support more than 1,380
                recorded species, including at least 341 endemic species that
                contribute to its scientific and conservation importance.
              </p>
              <p className="public-body mt-[16px]">
                Its ecological range, rare habitat types, and concentration of
                endemic life make the protected area one of the most important
                biodiversity sites in the Philippines.
              </p>
            </article>

            <article className="public-card p-[32px] md:p-[40px]">
              <p className="public-eyebrow">Notable Species</p>
              <div className="mt-[20px] space-y-[12px]">
                {notableSpecies.map((species) => (
                  <div key={species} className="public-card-soft p-[18px]">
                    <p className="public-body">{species}</p>
                  </div>
                ))}
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
              A globally significant montane ecosystem shaped by biodiversity,
              endemism, and adaptation to extreme environmental conditions.
            </h2>
            <p className="public-body-lg mt-[20px] max-w-3xl">
              The tropical upper montane rainforest of the Mount Hamiguitan
              Range Wildlife Sanctuary is recognized for exceptional ecological
              value. As a UNESCO World Heritage Site, the sanctuary preserves
              one of the most intact montane ecosystems in the Philippines and
              plays a critical role in biodiversity conservation and ecological
              stability.
            </p>
          </div>

          <div className="mt-[32px] grid gap-[20px] md:grid-cols-2 md:gap-[24px]">
            {rainforestBlocks.map((block) => (
              <article key={block.title} className="public-card p-[24px] sm:p-[28px] md:p-[32px]">
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

      <section className="public-section public-section-light">
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
    </PublicShell>
  );
}
