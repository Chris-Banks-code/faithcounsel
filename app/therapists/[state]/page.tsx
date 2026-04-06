import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { STATE_NAMES, STATE_ABBREV, SPECIALTY_LIST } from "@/lib/data";
import { searchTherapists } from "@/lib/therapists";

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  return Object.entries(STATE_NAMES).map(([, name]) => ({
    state: name.toLowerCase().replace(/\s+/g, "-"),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const abbrev = STATE_ABBREV[stateSlug];
  if (!abbrev) return { title: "Not Found" };
  const stateName = STATE_NAMES[abbrev];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://faithcounsel.vercel.app";
  const title = `Christian Therapists in ${stateName} | FaithCounsel`;
  const description = `Find licensed, faith-based Christian therapists and counselors in ${stateName}. Search by city, specialty, and insurance — free directory.`;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/therapists/${stateSlug}` },
    openGraph: { title, description, url: `${baseUrl}/therapists/${stateSlug}`, siteName: "FaithCounsel" },
  };
}

export default async function StatePage({ params }: Props) {
  const { state: stateSlug } = await params;
  const abbrev = STATE_ABBREV[stateSlug];
  if (!abbrev) notFound();

  const stateName = STATE_NAMES[abbrev];
  const therapists = await searchTherapists(abbrev);

  // Group by city for "Browse by City" section
  const cityCounts: Record<string, number> = {};
  for (const t of therapists) {
    if (t.city) cityCounts[t.city] = (cityCounts[t.city] ?? 0) + 1;
  }
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([city]) => city);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-700 to-teal-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-teal-200 text-sm mb-2">
            <Link href="/" className="hover:text-white transition">Home</Link>
            {" › "}
            <span>Therapists by State</span>
            {" › "}
            <span>{stateName}</span>
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Christian Therapists in {stateName}
          </h1>
          <p className="text-teal-100 text-lg">
            {therapists.length > 0
              ? `Browse ${therapists.length} licensed, faith-based therapists and counselors in ${stateName}.`
              : `Browse our directory of faith-based therapists and counselors in ${stateName}.`}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Browse by City */}
        {topCities.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Browse by City in {stateName}</h2>
            <div className="flex flex-wrap gap-2">
              {topCities.map((city) => (
                <Link
                  key={city}
                  href={`/search?state=${abbrev}&search=${encodeURIComponent(city)}`}
                  className="bg-teal-50 text-teal-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-teal-100 transition"
                >
                  {city} ({cityCounts[city]})
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Therapist listings */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            {therapists.length > 0
              ? `${therapists.length} Therapists in ${stateName}`
              : `Therapists in ${stateName}`}
          </h2>

          {therapists.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg mb-4">No listings yet for {stateName}.</p>
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
                href={`/search?state=${abbrev}`}
                className="inline-flex items-center text-teal-700 font-semibold hover:text-teal-800 transition"
              >
                View all {therapists.length} therapists in {stateName} →
              </Link>
            </div>
          )}
        </section>

        {/* Browse by Specialty */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Browse by Specialty in {stateName}</h2>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_LIST.map((s) => (
              <Link
                key={s.slug}
                href={`/search?state=${abbrev}&specialty=${encodeURIComponent(s.query)}`}
                className="bg-slate-100 text-slate-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-teal-50 hover:text-teal-700 transition"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </section>

        {/* SEO content block */}
        <section className="bg-white border border-slate-200 rounded-xl p-8 space-y-4 text-slate-600 leading-relaxed">
          <h2 className="text-xl font-bold text-slate-800">Finding a Christian Therapist in {stateName}</h2>
          <p>
            If you are looking for a faith-based therapist in {stateName}, FaithCounsel makes it easy to search
            licensed Christian counselors in your area. All therapists in our directory hold valid state licenses —
            including credentials such as LCSW, LPC, LMFT, and PsyD — and identify as integrating Christian faith
            into their practice.
          </p>
          <p>
            Whether you are dealing with anxiety, depression, relationship struggles, grief, or simply want a
            counselor who shares your faith, our directory covers therapists across {stateName}&apos;s major cities
            and rural areas alike. Many providers also offer telehealth sessions, giving you access to faith-based
            support from anywhere in the state.
          </p>
          <p>
            Use the filters above to narrow by city or specialty. When you contact a therapist, ask how they
            integrate their faith into the therapeutic process, what insurance they accept, and whether they are
            currently accepting new clients.
          </p>
          <p>
            <strong className="text-slate-800">If you are in a mental health crisis</strong>, please call or text{" "}
            <strong className="text-slate-800">988</strong> (Suicide &amp; Crisis Lifeline) — available 24/7 and free.
          </p>
        </section>
      </div>
    </div>
  );
}
