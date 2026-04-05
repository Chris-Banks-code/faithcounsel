import Link from "next/link";
import { getFeaturedTherapists } from "@/lib/therapists";
import SearchForm from "@/components/SearchForm";

export default async function HomePage() {
  const featured = await getFeaturedTherapists(6);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-700 to-teal-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find a Faith-Based Therapist Near You</h1>
          <p className="text-teal-100 text-lg mb-8">
            Search our directory of Christian therapists and counselors across the United States.
            Find the right fit for your journey.
          </p>
          <SearchForm />
        </div>
      </section>

      {/* 988 Crisis Banner */}
      <section className="bg-amber-50 border-y border-amber-200 py-4 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-amber-800 font-semibold text-sm">
            🆘 If you are in a crisis, call or text <strong>988</strong> (Suicide & Crisis Lifeline)
          </span>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Featured Therapists</h2>
        {featured.length === 0 ? (
          <p className="text-slate-500">No listings yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.slug}`}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-teal-300 transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-teal-700 transition">{listing.name}</h3>
                    <p className="text-sm text-slate-500">{listing.title}</p>
                  </div>
                  {listing.rating && (
                    <span className="bg-teal-50 text-teal-700 text-sm font-semibold px-2 py-1 rounded">
                      ★ {listing.rating}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-3">{listing.specialty || "Faith-based therapy"}</p>
                <div className="text-sm text-slate-500">
                  <span>{listing.city}, {listing.state}</span>
                  {listing.telehealth && (
                    <span className="ml-2 inline-flex items-center text-teal-600">✓ Telehealth</span>
                  )}
                </div>
                <p className="text-sm text-slate-700 mt-3 font-medium">{listing.phone}</p>
              </Link>
            ))}
          </div>
        )}
        <div className="text-center mt-8">
          <Link
            href="/search"
            className="inline-flex items-center text-teal-700 font-semibold hover:text-teal-800 transition"
          >
            View all listings →
          </Link>
        </div>
      </section>

      {/* About Snippet */}
      <section className="bg-white border-t border-t-200 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">About FaithCounsel</h2>
          <p className="text-slate-600 leading-relaxed">
            FaithCounsel is a free directory helping individuals and families find faith-based Christian therapists
            and counselors in their area. Our listings are compiled from public business data and updated based on
            user submissions. We are not a healthcare provider — we are a directory service designed to connect
            you with qualified professionals.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center mt-6 text-teal-700 font-semibold hover:text-teal-800 transition"
          >
            Learn more about us →
          </Link>
        </div>
      </section>
    </div>
  );
}
