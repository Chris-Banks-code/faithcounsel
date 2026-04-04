"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { mockListings, US_STATES, SPECIALTIES } from "@/lib/data";

export default function SearchFilters() {
  const [state, setState] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return mockListings.filter((listing) => {
      if (state && listing.state !== state) return false;
      if (specialty && !listing.specialty.toLowerCase().includes(specialty.toLowerCase())) return false;
      if (search && !listing.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
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
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:border-teal-400"
        >
          <option value="">All Specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-slate-500 text-sm mb-4">{filtered.length} therapist{filtered.length !== 1 ? "s" : ""} found</p>

      {/* Grid */}
      {filtered.length === 0 ? (
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
          {filtered.map((listing) => (
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
              <p className="text-sm text-slate-600 mb-3">{listing.specialty}</p>
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
