import { notFound } from "next/navigation";
import Link from "next/link";
import { getTherapistBySlug, getAllTherapists, getNearbyTherapists } from "@/lib/therapists";
import { SPECIALTY_LIST, STATE_NAMES } from "@/lib/data";
import JsonLd from "@/components/JsonLd";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const therapists = await getAllTherapists();
  return therapists.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const listing = await getTherapistBySlug(slug);
  if (!listing) return { title: "Not Found" };
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://faithcounsel.vercel.app";
  const title = `${listing.name} | ${listing.specialty ? listing.specialty.split(",")[0].trim() : "Christian Therapist"} in ${listing.city}, ${listing.state}`;
  const description = listing.bio
    ? listing.bio.slice(0, 155).trimEnd() + (listing.bio.length > 155 ? "…" : "")
    : `Find ${listing.name}, a licensed faith-based therapist${listing.specialty ? ` specializing in ${listing.specialty.split(",")[0].trim()}` : ""} in ${listing.city}, ${listing.state}. ${listing.telehealth ? "Telehealth available. " : ""}Contact for appointment.`;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/listings/${slug}` },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/listings/${slug}`,
      type: "profile",
      siteName: "FaithCounsel",
    },
  };
}

function buildFaqs(listing: Awaited<ReturnType<typeof getTherapistBySlug>>) {
  if (!listing) return [];
  const faqs: { q: string; a: string }[] = [];

  faqs.push({
    q: `Is ${listing.name} a Christian therapist?`,
    a: `Yes. ${listing.name} is listed in the FaithCounsel directory as a licensed, faith-based therapist who integrates Christian principles into their counseling practice.`,
  });

  if (listing.specialty) {
    faqs.push({
      q: `What does ${listing.name} specialize in?`,
      a: `${listing.name} specializes in ${listing.specialty}. They work with clients seeking faith-integrated support in these areas.`,
    });
  }

  faqs.push({
    q: `Where is ${listing.name} located?`,
    a: `${listing.name} is located in ${listing.city}, ${listing.state}.${listing.telehealth ? " They also offer telehealth sessions for clients who prefer remote appointments." : ""}`,
  });

  if (listing.insurance && listing.insurance.length > 0) {
    faqs.push({
      q: `Does ${listing.name} accept insurance?`,
      a: `${listing.name} accepts the following insurance plans: ${listing.insurance.join(", ")}. Contact them directly to confirm your specific plan is currently accepted.`,
    });
  } else {
    faqs.push({
      q: `Does ${listing.name} accept insurance?`,
      a: `Please contact ${listing.name} directly to confirm insurance coverage and payment options.`,
    });
  }

  faqs.push({
    q: `How do I book an appointment with ${listing.name}?`,
    a: listing.phone
      ? `You can reach ${listing.name} by calling ${listing.phone}.${listing.website ? " You can also visit their website to request an appointment." : ""}`
      : listing.website
      ? `Visit ${listing.name}'s website to request an appointment.`
      : `Contact ${listing.name} through the information provided on this page.`,
  });

  if (listing.telehealth) {
    faqs.push({
      q: `Does ${listing.name} offer telehealth or online therapy?`,
      a: `Yes, ${listing.name} offers telehealth sessions. Online therapy can be a convenient option if you are unable to attend in-person appointments.`,
    });
  }

  if (listing.session_rate && listing.session_rate !== "unavailable") {
    faqs.push({
      q: `What is ${listing.name}'s session rate?`,
      a: `${listing.name}'s session rate is listed as ${listing.session_rate}. Rates may vary — contact them directly for the most current pricing.`,
    });
  }

  return faqs;
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getTherapistBySlug(slug);
  if (!listing) notFound();

  const nearby = await getNearbyTherapists(listing.state, slug, 3);
  const faqs = buildFaqs(listing);

  const stateName = STATE_NAMES[listing.state];
  const stateSlug = stateName ? stateName.toLowerCase().replace(/\s+/g, "-") : null;

  // Match specialties to our specialty pages
  const matchedSpecialties = listing.specialty
    ? SPECIALTY_LIST.filter((s) =>
        listing.specialty!.toLowerCase().includes(s.query.toLowerCase())
      )
    : [];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://faithcounsel.vercel.app";

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/listings/${slug}`,
    name: listing.name,
    description: listing.bio || `Faith-based Christian therapist in ${listing.city}, ${listing.state}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city,
      addressRegion: listing.state,
      addressCountry: "US",
    },
    ...(listing.phone && { telephone: listing.phone }),
    ...(listing.website && { url: listing.website }),
    ...(listing.telehealth && {
      availableChannel: { "@type": "ServiceChannel", serviceType: "Telehealth" },
    }),
    ...(listing.session_rate && listing.session_rate !== "unavailable" && {
      priceRange: listing.session_rate,
    }),
    ...(listing.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: listing.rating,
        reviewCount: listing.reviews ?? 1,
      },
    }),
  };

  const faqSchema = faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      ...(stateSlug
        ? [{ "@type": "ListItem", position: 2, name: `${stateName} Therapists`, item: `${baseUrl}/therapists/${stateSlug}` }]
        : []),
      { "@type": "ListItem", position: stateSlug ? 3 : 2, name: listing.name, item: `${baseUrl}/listings/${slug}` },
    ],
  };

  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${listing.name} ${listing.city} ${listing.state}`)}`;

  return (
    <>
      <JsonLd data={localBusinessSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <JsonLd data={breadcrumbSchema} />

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <nav className="text-sm text-slate-400 mb-6 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-teal-700 transition">Home</Link>
          <span>›</span>
          {stateSlug && stateName ? (
            <>
              <Link href={`/therapists/${stateSlug}`} className="hover:text-teal-700 transition">
                {stateName}
              </Link>
              <span>›</span>
            </>
          ) : (
            <>
              <Link href="/search" className="hover:text-teal-700 transition">Search</Link>
              <span>›</span>
            </>
          )}
          <span className="text-slate-600">{listing.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile card */}
            <div className="bg-white rounded-xl border border-slate-200 p-7">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">{listing.name}</h1>
                  <p className="text-slate-500 mt-1">{listing.title}</p>
                  <p className="text-sm text-teal-700 font-medium mt-1">
                    {listing.city}, {listing.state}
                    {listing.telehealth && (
                      <span className="ml-2 text-blue-600">· Telehealth available</span>
                    )}
                  </p>
                </div>
                {listing.rating && (
                  <div className="flex-shrink-0 text-center bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
                    <div className="text-teal-700 font-bold text-xl">★ {listing.rating}</div>
                    {listing.reviews && (
                      <div className="text-xs text-slate-500 mt-0.5">{listing.reviews} reviews</div>
                    )}
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                {listing.telehealth && (
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    ✓ Telehealth
                  </span>
                )}
                {listing.session_rate && listing.session_rate !== "unavailable" && (
                  <span className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    {listing.session_rate} / session
                  </span>
                )}
                {listing.insurance?.map((ins) => (
                  <span key={ins} className="bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full">
                    {ins}
                  </span>
                ))}
              </div>

              {/* Specialties */}
              {listing.specialty && (
                <div className="border-t border-slate-100 pt-5 mb-5">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Specialties</h2>
                  <p className="text-slate-700">{listing.specialty}</p>
                  {matchedSpecialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {matchedSpecialties.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/specialties/${s.slug}`}
                          className="text-xs text-teal-700 bg-teal-50 px-3 py-1 rounded-full hover:bg-teal-100 transition"
                        >
                          {s.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* About / Bio */}
              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  About {listing.name}
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {listing.bio ||
                    `${listing.name} is a licensed ${listing.title || "therapist"} based in ${listing.city}, ${listing.state} who integrates Christian faith into their counseling practice. ${listing.specialty ? `Areas of focus include ${listing.specialty}.` : ""} ${listing.telehealth ? "Telehealth sessions are available." : ""} Contact ${listing.name} directly for more information about their approach and availability.`}
                </p>
              </div>
            </div>

            {/* FAQ section */}
            {faqs.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-7">
                <h2 className="text-lg font-bold text-slate-800 mb-5">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-5">
                  {faqs.map((faq, i) => (
                    <div key={i} className="border-b border-slate-100 last:border-0 pb-5 last:pb-0">
                      <h3 className="font-semibold text-slate-800 mb-1.5">{faq.q}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Contact card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Contact</h2>
              <div className="space-y-3">
                {listing.phone && (
                  <a
                    href={`tel:${listing.phone.replace(/\D/g, "")}`}
                    className="flex items-center gap-3 text-slate-700 hover:text-teal-700 transition"
                  >
                    <span className="text-lg">📞</span>
                    <span className="font-medium">{listing.phone}</span>
                  </a>
                )}
                {listing.website && (
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-teal-700 hover:text-teal-800 transition text-sm"
                  >
                    <span className="text-lg">🌐</span>
                    <span className="font-medium">Visit website</span>
                  </a>
                )}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-600 hover:text-teal-700 transition text-sm"
                >
                  <span className="text-lg">📍</span>
                  <span>{listing.city}, {listing.state}</span>
                </a>
              </div>
            </div>

            {/* State page link */}
            {stateSlug && stateName && (
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
                <p className="text-sm text-slate-600 mb-2">
                  Browse more faith-based therapists in {stateName}:
                </p>
                <Link
                  href={`/therapists/${stateSlug}`}
                  className="text-teal-700 font-semibold text-sm hover:text-teal-800 transition"
                >
                  All {stateName} therapists →
                </Link>
              </div>
            )}

            {/* Crisis notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-amber-800 text-xs leading-relaxed">
                <strong>In a crisis?</strong> Call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline) — free, confidential, 24/7.
              </p>
            </div>

            {/* Disclaimer */}
            <p className="text-slate-400 text-xs leading-relaxed">
              FaithCounsel is a directory. Always verify credentials and insurance directly with the provider before scheduling.
            </p>
          </div>
        </div>

        {/* Nearby therapists */}
        {nearby.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Other Christian Therapists in {listing.state}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {nearby.map((t) => (
                <Link
                  key={t.id}
                  href={`/listings/${t.slug}`}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-teal-300 transition group"
                >
                  <h3 className="font-bold text-slate-800 group-hover:text-teal-700 transition text-sm mb-1">
                    {t.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-2">{t.title}</p>
                  <p className="text-xs text-slate-600 mb-2 line-clamp-1">{t.specialty || "Faith-based therapy"}</p>
                  <div className="text-xs text-slate-400">
                    {t.city}, {t.state}
                    {t.telehealth && <span className="ml-1 text-teal-600">· Telehealth</span>}
                  </div>
                </Link>
              ))}
            </div>
            {stateSlug && (
              <div className="text-center mt-5">
                <Link
                  href={`/therapists/${stateSlug}`}
                  className="text-teal-700 font-semibold text-sm hover:text-teal-800 transition"
                >
                  View all therapists in {stateName} →
                </Link>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
