import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FaithCounsel — Find a Faith-Based Therapist Near You",
  description:
    "Search our directory of Christian therapists and counselors across the United States. Find the right fit for your journey.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
