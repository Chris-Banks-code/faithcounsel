import { MetadataRoute } from "next";
import { getAllTherapists } from "@/lib/therapists";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://faithcounsel.vercel.app";

  const staticPages = ["", "/search", "/about", "/privacy-policy", "/terms-of-service"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  let listingPages: MetadataRoute.Sitemap = [];

  try {
    const therapists = await getAllTherapists();
    listingPages = therapists.map((listing) => ({
      url: `${baseUrl}/listings/${listing.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch (err) {
    console.error("Sitemap: failed to fetch therapists:", err);
  }

  return [...staticPages, ...listingPages];
}
