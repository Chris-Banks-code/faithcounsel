import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
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
      <body>
        {children}
        {/* Google Analytics — replace G-XXXXXXXXXX with actual Measurement ID */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </body>
    </html>
  );
}
