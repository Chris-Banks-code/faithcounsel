"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { US_STATES } from "@/lib/data";

function slugify(name: string, city: string, state: string): string {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `${normalize(name)}-${normalize(city)}-${normalize(state)}`;
}

interface Therapist {
  id: string;
  name: string;
  credentials: string | null;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  specialties: string | null;
  insurance: string | null;
  telehealth: string;
}

interface Listing {
  id: string;
  slug: string;
  name: string;
  title: string;
  specialty: string;
  city: string;
  state: string;
  phone: string;
  website?: string;
  telehealth: boolean;
  insurance: string[];
}

export default function SearchFilters() {
  const [state, setState] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (specialty) params.set("specialty", specialty);
    if (search) params.set("search", search);

    fetch(`/api/therapists?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          const mapped: Listing[] = res.data.map((t: Therapist) => ({
            id: t.id,
            slug: slugify(t.name, t.city, t.state),
            name: t.name,
            title: t.credentials || "Therapist",
            specialty: t.specialties || "",
            city: t.city,
            state: t.state,
            phone: t.phone || "",
            website: t.website || undefined,
            telehealth: t.telehealth === "yes",
            insurance: t.insurance
              ? t.insurance.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          }));
          setListings(mapped);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [state, specialty, search]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:border-teal-400"
        />
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:border-teal-400"
        >
          <option value="">All States</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by specialty..."
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:border-teal-400"
        />
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-slate-500 text-sm mb-4">
          {listings.length} therapist{listings.length !== 1 ? "s" : ""} found
        </p>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <p>Loading listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No therapists found matching your criteria.</p>
          <button
            onClick={() => { setState(""); setSpecialty(""); setSearch(""); }}
            className="mt-4 text-teal-700 font-semibold hover:text-teal-800"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
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
    </div>
  );
}
