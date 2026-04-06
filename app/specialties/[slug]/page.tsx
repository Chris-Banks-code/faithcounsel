import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { SPECIALTY_LIST, STATE_NAMES } from "@/lib/data";
import { searchTherapists } from "@/lib/therapists";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SPECIALTY_LIST.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const specialty = SPECIALTY_LIST.find((s) => s.slug === slug);
  if (!specialty) return { title: "Not Found" };
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://faithcounsel.vercel.app";
  const title = `Christian Therapists for ${specialty.label} | FaithCounsel`;
  const description = `Find licensed, faith-based Christian therapists specializing in ${specialty.label}. Search by location and insurance — free directory.`;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/specialties/${slug}` },
    openGraph: { title, description, url: `${baseUrl}/specialties/${slug}`, siteName: "FaithCounsel" },
  };
}

const SPECIALTY_DESCRIPTIONS: Record<string, string> = {
  anxiety:
    "Anxiety is one of the most common reasons people seek therapy. Christian therapists who specialize in anxiety use evidence-based methods like Cognitive Behavioral Therapy (CBT) and Acceptance and Commitment Therapy (ACT), often integrating faith-based perspectives on fear, trust, and peace.",
  depression:
    "Depression can affect every area of life. Faith-based therapists who specialize in depression bring both clinical expertise and a compassionate, hope-filled perspective that honors the full complexity of your experience — including the spiritual dimension.",
  trauma:
    "Trauma-specialized Christian therapists are trained in evidence-based approaches like EMDR and trauma-focused CBT, and can also address the spiritual wounds that often accompany traumatic experiences. Healing is possible.",
  ptsd:
    "Post-Traumatic Stress Disorder requires specialized clinical care. Christian therapists trained in PTSD treatment use protocols like Prolonged Exposure and EMDR, bringing a faith-integrated approach that addresses the whole person.",
  "marriage-and-family":
    "Christian marriage and family therapists (LMFTs) are trained to work with couples and family systems. They bring clinical expertise in communication, conflict, attachment, and trust — alongside a shared understanding of covenant and commitment.",
  "addiction-recovery":
    "Recovery from addiction is a journey that benefits enormously from community, purpose, and hope. Faith-based counselors who specialize in addiction work alongside 12-step programs and clinical treatment to address the spiritual roots and relational wounds that often underlie substance use.",
  "grief-and-loss":
    "Grief is a natural response to loss, but it can be deeply isolating. Christian grief counselors walk alongside you in your sorrow with compassion, clinical skill, and a perspective rooted in hope and the reality of eternal life.",
  "couples-therapy":
    "Couples therapy with a Christian counselor provides a safe space to address conflict, rebuild trust, and deepen connection. Using methods like the Gottman Method and Emotionally Focused Therapy within a faith framework, these therapists help couples grow stronger together.",
  ocd:
    "OCD is a treatable condition that responds well to Exposure and Response Prevention (ERP) therapy. Christian therapists trained in OCD treatment bring both clinical precision and a compassionate, faith-informed perspective.",
  "panic-disorder":
    "Panic disorder can be frightening and disruptive. Therapists specializing in panic use CBT and other evidence-based techniques to help you understand and manage panic attacks, often integrating prayer and faith as sources of grounding and courage.",
  "adolescent-therapy":
    "Adolescence is a critical and often turbulent season. Christian therapists who specialize in working with teens and young adults understand the unique pressures of this stage — identity, relationships, faith, and the future — and provide a supportive space for growth.",
  "life-transitions":
    "Major life changes — a new job, a move, marriage, divorce, retirement, or loss — can shake our sense of identity and purpose. Faith-based therapists who specialize in life transitions help you navigate change with clarity, resilience, and renewed hope.",
};

export default async function SpecialtyPage({ params }: Props) {
  const { slug } = await params;
  const specialty = SPECIALTY_LIST.find((s) => s.slug === slug);
  if (!specialty) notFound();

  const therapists = await searchTherapists(undefined, specialty.query);

  // Count by state
  const stateCounts: Record<string, number> = {};
  for (const t of therapists) {
    if (t.state) stateCounts[t.state] = (stateCounts[t.state] ?? 0) + 1;
  }
  const topStates = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const description = SPECIALTY_DESCRIPTIONS[slug] ?? `Find licensed, faith-based Christian therapists specializing in ${specialty.label}.`;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-700 to-teal-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-teal-200 text-sm mb-2">
            <Link href="/" className="hover:text-white transition">Home</Link>
            {" › "}
            <span>Specialties</span>
            {" › "}
            <span>{specialty.label}</span>
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Christian Therapists for {specialty.label}
          </h1>
          <p className="text-teal-100 text-lg">
            {therapists.length > 0
              ? `Browse ${therapists.length} faith-based therapists specializing in ${specialty.label}.`
              : `Browse our directory of faith-based therapists specializing in ${specialty.label}.`}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* About this specialty */}
        <section className="mb-10 bg-teal-50 border border-teal-100 rounded-xl p-6">
          <p className="text-slate-700 leading-relaxed">{description}</p>
        </section>

        {/* Browse by state */}
        {topStates.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Browse {specialty.label} Therapists by State</h2>
            <div className="flex flex-wrap gap-2">
              {topStates.map(([abbrev, count]) => {
                const name = STATE_NAMES[abbrev] ?? abbrev;
                const stateSlug = name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={abbrev}
                    href={`/therapists/${stateSlug}`}
                    className="bg-white border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-full hover:border-teal-400 hover:text-teal-700 transition"
                  >
                    {name} ({count})
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Therapist listings */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            {therapists.length > 0
              ? `${therapists.length} Faith-Based ${specialty.label} Therapists`
              : `${specialty.label} Therapists`}
          </h2>

          {therapists.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg mb-4">No listings yet for this specialty.</p>
              <Link href="/search" className="text-teal-700 font-semibold hover:text-teal-800">
                Browse all therapists →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {therapists.slice(0, 18).map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.slug}`}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-teal-300 transition group"
                >
                  <h3 className="font-bold text-slate-800 group-hover:text-teal-700 transition mb-1">
                    {listing.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-2">{listing.title}</p>
                  <p className="text-sm text-slate-600 mb-3">{listing.specialty || "Faith-based therapy"}</p>
                  <div className="text-sm text-slate-500">
                    <span>{listing.city}, {listing.state}</span>
                    {listing.telehealth && (
                      <span className="ml-2 text-teal-600">✓ Telehealth</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {therapists.length > 18 && (
            <div className="text-center mt-8">
              <Link
                href={`/search?specialty=${encodeURIComponent(specialty.query)}`}
                className="inline-flex items-center text-teal-700 font-semibold hover:text-teal-800 transition"
              >
                View all {therapists.length} {specialty.label} therapists →
              </Link>
            </div>
          )}
        </section>

        {/* Other specialties */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Other Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_LIST.filter((s) => s.slug !== slug).map((s) => (
              <Link
                key={s.slug}
                href={`/specialties/${s.slug}`}
                className="bg-slate-100 text-slate-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-teal-50 hover:text-teal-700 transition"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
