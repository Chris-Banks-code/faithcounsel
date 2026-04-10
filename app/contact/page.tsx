import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us — FaithCounsel",
  description:
    "Get in touch with the FaithCounsel team. Submit a listing, report incorrect information, or ask a question about our faith-based therapist directory.",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Contact Us</h1>
      <p className="text-slate-500 mb-10">
        We&apos;re here to help. Reach out for any of the reasons below.
      </p>

      <div className="space-y-8">
        {/* Submit / Update a Listing */}
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-teal-800 mb-1">
            Submit or Update a Listing
          </h2>
          <p className="text-slate-600 text-sm mb-3">
            Are you a faith-based therapist or counselor? Want to add your
            practice or correct existing information?
          </p>
          <a
            href="mailto:listings@faithcounsel.com"
            className="inline-block bg-teal-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-teal-800 transition"
          >
            Email listings@faithcounsel.com
          </a>
        </div>

        {/* Report Incorrect Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            Report Incorrect Information
          </h2>
          <p className="text-slate-600 text-sm mb-3">
            Found outdated contact details, a closed practice, or other
            inaccurate information? Let us know and we&apos;ll update it promptly.
          </p>
          <a
            href="mailto:support@faithcounsel.com"
            className="inline-block bg-slate-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            Email support@faithcounsel.com
          </a>
        </div>

        {/* General Inquiries */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            General Inquiries
          </h2>
          <p className="text-slate-600 text-sm mb-3">
            Partnerships, press, or general questions about FaithCounsel.
          </p>
          <a
            href="mailto:hello@faithcounsel.com"
            className="inline-block bg-slate-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            Email hello@faithcounsel.com
          </a>
        </div>

        {/* Crisis Notice */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-1">
            In Crisis? Get Help Now
          </h2>
          <p className="text-slate-600 text-sm">
            If you or someone you know is in immediate danger, call{" "}
            <strong>911</strong>. For mental health crisis support, call or text{" "}
            <strong>988</strong> (Suicide &amp; Crisis Lifeline) — available
            24/7, free and confidential.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <Link href="/" className="text-teal-700 font-semibold hover:text-teal-800 text-sm">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
