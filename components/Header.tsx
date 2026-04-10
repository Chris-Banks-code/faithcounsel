"use client";

import Link from "next/link";
import { useState } from "react";
import { SPECIALTY_LIST } from "@/lib/data";

const POPULAR_STATES = [
  { slug: "texas", label: "Texas" },
  { slug: "california", label: "California" },
  { slug: "florida", label: "Florida" },
  { slug: "new-york", label: "New York" },
  { slug: "georgia", label: "Georgia" },
  { slug: "north-carolina", label: "North Carolina" },
  { slug: "tennessee", label: "Tennessee" },
  { slug: "ohio", label: "Ohio" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="text-teal-700 font-bold text-xl tracking-tight">
          FaithCounsel
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/search" className="hover:text-teal-700 transition">
            Find a Therapist
          </Link>

          {/* States dropdown */}
          <div className="relative group">
            <button className="hover:text-teal-700 transition flex items-center gap-1">
              Browse States
              <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 pt-2 hidden group-hover:block">
              <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-52">
                {POPULAR_STATES.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/therapists/${s.slug}`}
                    className="block py-1.5 px-2 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition text-sm"
                  >
                    {s.label}
                  </Link>
                ))}
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <Link
                    href="/search"
                    className="block py-1.5 px-2 text-teal-700 font-semibold hover:bg-teal-50 rounded-lg transition text-sm"
                  >
                    All states →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Specialties dropdown */}
          <div className="relative group">
            <button className="hover:text-teal-700 transition flex items-center gap-1">
              Specialties
              <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 pt-2 hidden group-hover:block">
              <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-52">
                {SPECIALTY_LIST.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/specialties/${s.slug}`}
                    className="block py-1.5 px-2 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition text-sm"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link href="/blog" className="hover:text-teal-700 transition">
            Blog
          </Link>
          <Link href="/about" className="hover:text-teal-700 transition">
            About
          </Link>
          <Link href="/contact" className="hover:text-teal-700 transition">
            Contact
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-slate-600 hover:text-teal-700 transition"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-3 text-sm font-medium text-slate-700">
            <Link href="/search" className="py-2 hover:text-teal-700" onClick={() => setMenuOpen(false)}>Find a Therapist</Link>
            <div className="py-2 font-semibold text-slate-400 text-xs uppercase tracking-wide mt-2">Popular States</div>
            {POPULAR_STATES.map((s) => (
              <Link key={s.slug} href={`/therapists/${s.slug}`} className="py-1.5 pl-2 hover:text-teal-700" onClick={() => setMenuOpen(false)}>
                {s.label}
              </Link>
            ))}
            <div className="py-2 font-semibold text-slate-400 text-xs uppercase tracking-wide mt-2">Specialties</div>
            {SPECIALTY_LIST.slice(0, 6).map((s) => (
              <Link key={s.slug} href={`/specialties/${s.slug}`} className="py-1.5 pl-2 hover:text-teal-700" onClick={() => setMenuOpen(false)}>
                {s.label}
              </Link>
            ))}
            <Link href="/blog" className="py-2 hover:text-teal-700 mt-2" onClick={() => setMenuOpen(false)}>Blog</Link>
            <Link href="/about" className="py-2 hover:text-teal-700" onClick={() => setMenuOpen(false)}>About</Link>
            <Link href="/contact" className="py-2 hover:text-teal-700" onClick={() => setMenuOpen(false)}>Contact</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
