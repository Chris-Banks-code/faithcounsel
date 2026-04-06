import Link from "next/link";
import { STATE_NAMES, SPECIALTY_LIST } from "@/lib/data";

const POPULAR_STATES = [
  "TX","CA","FL","NY","GA","NC","TN","OH","IL","PA",
  "VA","AZ","WA","CO","MO","SC","AL","KY","IN","OR",
];

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <Link href="/" className="text-white font-bold text-lg">FaithCounsel</Link>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              A free directory connecting individuals and families with licensed, faith-based Christian therapists across the United States.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              In crisis? Call or text <span className="text-white font-semibold">988</span>
            </p>
          </div>

          {/* Browse by State */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Browse by State</h3>
            <ul className="space-y-1.5">
              {POPULAR_STATES.map((abbrev) => {
                const name = STATE_NAMES[abbrev];
                const slug = name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <li key={abbrev}>
                    <Link
                      href={`/therapists/${slug}`}
                      className="text-sm text-slate-400 hover:text-teal-400 transition"
                    >
                      {name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Specialties */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Specialties</h3>
            <ul className="space-y-1.5">
              {SPECIALTY_LIST.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/specialties/${s.slug}`}
                    className="text-sm text-slate-400 hover:text-teal-400 transition"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources & Legal */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Resources</h3>
            <ul className="space-y-1.5">
              <li><Link href="/blog" className="text-sm text-slate-400 hover:text-teal-400 transition">Blog</Link></li>
              <li><Link href="/search" className="text-sm text-slate-400 hover:text-teal-400 transition">Find a Therapist</Link></li>
              <li><Link href="/about" className="text-sm text-slate-400 hover:text-teal-400 transition">About</Link></li>
            </ul>
            <h3 className="text-white font-semibold text-sm mb-3 mt-6">Legal</h3>
            <ul className="space-y-1.5">
              <li><Link href="/privacy-policy" className="text-sm text-slate-400 hover:text-teal-400 transition">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-sm text-slate-400 hover:text-teal-400 transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-10 pt-6 text-xs text-slate-500 text-center">
          FaithCounsel is a directory service. We are not a healthcare provider. Always verify credentials with your state licensing board.
          <br />© {new Date().getFullYear()} FaithCounsel. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
