import { notFound } from "next/navigation";
import Link from "next/link";
import { mockListings } from "@/lib/data";
import JsonLd from "@/components/JsonLd";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return mockListings.map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const listing = mockListings.find((l) => l.slug === slug);
  if (!listing) return { title: "Not Found" };
  return {
    title: `${listing.name} | ${listing.specialty} in ${listing.city}, ${listing.state}`,
    description: `Find ${listing.name}, a ${listing.title} specializing in ${listing.specialty}. Located in ${listing.city}, ${listing.state}.`,
  };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = mockListings.find((l) => l.slug === slug);
  if (!listing) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PsychologicalHealth",
    name: listing.name,
    description: listing.specialty,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zip,
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

          <div className="border-t border-slate-100 pt-4 mb-4">
            <p className="text-slate-700 font-medium mb-2">Specialties</p>
            <p className="text-slate-600">{listing.specialty}</p>
          </div>

          <div className="border-t border-slate-100 pt-4 mb-4">
            <p className="text-slate-700 font-medium mb-2">Location</p>
            <p className="text-slate-600">
              {listing.address}, {listing.city}, {listing.state} {listing.zip}
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
            {listing.accepting_new && (
              <span className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">✓ Accepting new patients</span>
            )}
            {listing.telehealth && (
              <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">✓ Telehealth available</span>
            )}
            {listing.insurance && listing.insurance.length > 0 && (
              <span className="bg-slate-100 text-slate-600 text-sm px-3 py-1 rounded-full">
                Insurance: {listing.insurance.join(", ")}
              </span>
            )}
          </div>
        </div>

        <p className="text-slate-400 text-xs mt-6 text-center">
          FaithCounsel is a directory. Contact the provider directly to confirm insurance and availability.
          If you are in a crisis, call or text <strong>988</strong>.
        </p>
      </div>
    </>
  );
}
