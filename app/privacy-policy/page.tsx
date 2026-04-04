import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — FaithCounsel",
  description:
    "FaithCounsel privacy policy. We collect minimal data necessary to operate our therapist directory.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-slate-600 leading-relaxed">
        <p><strong>Effective Date:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">Information We Collect</h2>
        <p>
          FaithCounsel collects publicly available business information about mental health professionals,
          including names, addresses, phone numbers, websites, and professional credentials. We do not
          collect personal health information (PHI) as defined under HIPAA.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">How We Use Information</h2>
        <p>
          Information collected is used solely to provide and improve our directory service. We do not
          sell, rent, or share provider information to third parties for marketing purposes.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">Cookies</h2>
        <p>
          We use essential cookies to operate our website. We also use analytics tools (e.g., Google Analytics)
          to understand site traffic. You may disable cookies in your browser settings.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">Third-Party Links</h2>
        <p>
          Our directory may link to external therapist websites. We are not responsible for the privacy
          practices of external sites.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-6">Contact</h2>
        <p>
          For privacy-related questions, contact us through our available channels.
        </p>
      </div>
    </div>
  );
}
