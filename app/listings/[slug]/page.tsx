import { notFound } from "next/navigation";
import Link from "next/link";
import { getTherapistBySlug, getAllTherapists } from "@/lib/therapists";
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
  return {
    title: `${listing.name} | ${listing.specialty || "Therapist"} in ${listing.city}, ${listing.state}`,
    description: `Find ${listing.name}, specializing in ${listing.specialty || "faith-based therapy"}. Located in ${listing.city}, ${listing.state}.`,
  };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getTherapistBySlug(slug);
  if (!listing) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PsychologicalHealth",
    name: listing.name,
    description: listing.specialty,
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city,
      addressRegion: listing.state,
      addressCountry: "US",
    },
    telephone: listing.phone,
    url: listing.website,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/search" className="text-teal-700 font-semibold hover:text-teal-800 text-sm mb-6 inline-block">
          ← Back to search
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{listing.name}</h1>
              <p className="text-slate-500 mt-1">{listing.title}</p>
            </div>
            {listing.rating && (
              <span className="bg-teal-50 text-teal-700 font-semibold px-3 py-1 rounded text-sm">
                ★ {listing.rating} ({listing.reviews} reviews)
              </span>
            )}
          </div>

          {listing.specialty && (
            <div className="border-t border-slate-100 pt-4 mb-4">
              <p className="text-slate-700 font-medium mb-2">Specialties</p>
              <p className="text-slate-600">{listing.specialty}</p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 mb-4">
            <p className="text-slate-700 font-medium mb-2">Location</p>
            <p className="text-slate-600">
              {listing.city}, {listing.state}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4 mb-4">
            <p className="text-slate-700 font-medium mb-2">Contact</p>
            <p className="text-slate-600">{listing.phone}</p>
            {listing.website && (
              <a
                href={listing.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 hover:text-teal-800 text-sm mt-1 inline-block"
              >
                Visit website →
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {listing.telehealth && (
              <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">✓ Telehealth available</span>
            )}
            {listing.insurance && listing.insurance.length > 0 && (
              <span className="bg-slate-100 text-slate-600 text-sm px-3 py-1 rounded-full">
                Insurance: {listing.insurance.join(", ")}
              </span>
            )}
            {listing.session_rate && listing.session_rate !== "unavailable" && (
              <span className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">
                Session rate: {listing.session_rate}
              </span>
            )}
          </div>

          {listing.bio && (
            <div className="border-t border-slate-100 pt-4 mt-4">
              <p className="text-slate-700 font-medium mb-2">About</p>
              <p className="text-slate-600">{listing.bio}</p>
            </div>
          )}
        </div>

        <p className="text-slate-400 text-xs mt-6 text-center">
          FaithCounsel is a directory. Contact the provider directly to confirm insurance and availability.
          If you are in a crisis, call or text <strong>988</strong>.
        </p>
      </div>
    </>
  );
}
