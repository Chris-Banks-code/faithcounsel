import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About FaithCounsel",
  description:
    "FaithCounsel is a free directory connecting individuals and families with faith-based Christian therapists and counselors across the United States.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">About FaithCounsel</h1>
      <div className="space-y-4 text-slate-600 leading-relaxed">
        <p>
          FaithCounsel is a free directory helping individuals and families find faith-based Christian therapists
          and counselors in their area. We believe that mental health support rooted in faith can be transformative,
          and our mission is to make that support easier to find.
        </p>
        <p>
          Our listings are compiled from public business data and updated based on user submissions. We verify
          information where possible, but we encourage users to confirm details directly with providers before
          scheduling appointments.
        </p>
        <p>
          <strong>We are not a healthcare provider.</strong> We are a directory service designed to connect
          you with qualified professionals. If you are in a crisis, please call or text <strong>988</strong> to
          reach the Suicide & Crisis Lifeline.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">Our Standards</h2>
        <p>
          We list licensed mental health professionals who integrate Christian faith into their practice.
          All listed providers hold relevant licenses and credentials in their respective states.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">Contact</h2>
        <p>
          To submit a listing, update information, or ask a general question, visit our{" "}
          <Link href="/contact" className="text-teal-700 underline hover:text-teal-800">contact page</Link>.
        </p>
      </div>
      <div className="mt-8">
        <Link href="/search" className="text-teal-700 font-semibold hover:text-teal-800">
          ← Back to search
        </Link>
      </div>
    </div>
  );
}
