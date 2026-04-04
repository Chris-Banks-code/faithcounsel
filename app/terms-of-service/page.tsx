import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — FaithCounsel",
  description: "Terms of service for FaithCounsel directory.",
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Terms of Service</h1>
      <div className="space-y-4 text-slate-600 leading-relaxed">
        <p><strong>Effective Date:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">Directory Use</h2>
        <p>
          FaithCounsel provides a directory of mental health professionals. We do not provide medical
          advice, diagnosis, or treatment. All listed professionals are independent practitioners and
          are not employees or agents of FaithCounsel.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">No Professional Relationship</h2>
        <p>
          Using our directory does not create a professional, therapeutic, or contractual relationship
          between you and FaithCounsel.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">Information Accuracy</h2>
        <p>
          We strive to keep directory information accurate and up to date, but we cannot guarantee that
          all information is current. Always verify details directly with the provider.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">User Submissions</h2>
        <p>
          If you submit listing updates or feedback, you represent that the information provided is accurate
          to the best of your knowledge.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">Limitation of Liability</h2>
        <p>
          FaithCounsel is not liable for any damages arising from your use of this directory or your
          interactions with listed professionals.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">Changes</h2>
        <p>
          We may update these terms at any time. Continued use of the site constitutes acceptance of
          updated terms.
        </p>
      </div>
    </div>
  );
}
