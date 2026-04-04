import { MetadataRoute } from "next";
import { mockListings } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://faithcounsel.vercel.app";
  const staticPages = ["", "/search", "/about", "/privacy-policy", "/terms-of-service"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const listingPages = mockListings.map((listing) => ({
    url: `${baseUrl}/listings/${listing.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...listingPages];
}
