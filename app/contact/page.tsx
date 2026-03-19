import PublicShell from "@/app/components/public/PublicShell";

const contactItems = [
  {
    label: "Email",
    value: "info@hamiguitan-sanctuary.local",
  },
  {
    label: "Phone",
    value: "+63 (000) 000-0000",
  },
  {
    label: "Office",
    value: "Mount Hamiguitan administrative office placeholder",
  },
];

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="public-section public-section-soft border-b border-[var(--public-border)]">
        <div className="public-container max-w-[1120px] py-[48px] md:py-[80px]">
          <p className="public-eyebrow">Contact Us</p>
          <h1 className="public-h1 mt-[16px] max-w-4xl">
            Reach the Mt. Hamiguitan team for coordination, inquiries, and
            protected area-related support.
          </h1>
          <p className="public-body-lg mt-[24px] max-w-3xl">
            Use these placeholders until final contact details are confirmed.
            The layout is ready for production values without adding fake
            backend form handling.
          </p>
        </div>
      </section>

      <section className="public-section public-section-light">
        <div className="public-container max-w-[1120px] py-[32px] md:py-[48px]">
          <div className="grid gap-[24px] md:grid-cols-[1.05fr_0.95fr]">
            <article className="public-card p-[32px] md:p-[40px]">
              <h2 className="public-h3">Contact Information</h2>
              <p className="public-body mt-[16px] max-w-2xl">
                Use the channels below for public coordination and institutional
                inquiries related to Mt. Hamiguitan.
              </p>
              <div className="mt-[32px] grid gap-[16px]">
                {contactItems.map((item) => (
                  <div key={item.label} className="public-card-soft p-[20px]">
                    <p className="public-eyebrow tracking-[0.2em]">
                      {item.label}
                    </p>
                    <p className="mt-[8px] text-base leading-7 text-[var(--ui-text-main)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="public-card p-[32px] md:p-[40px]">
              <h2 className="public-h3">Coordination Notes</h2>
              <div className="public-body mt-[24px] space-y-[24px]">
                <p>
                  This public page is intentionally simple and does not add form
                  submission logic. It provides a clean contact card area that
                  can be updated once confirmed office and communications
                  details are available.
                </p>
                <div className="public-card-soft p-[20px]">
                  Keep this section for office instructions, availability, or
                  public coordination notes once final operational details are
                  approved.
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
