import { MetadataRoute } from "next";
import { getAllTherapists } from "@/lib/therapists";
import { STATE_NAMES, SPECIALTY_LIST } from "@/lib/data";
import { BLOG_POSTS } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://faithcounsel.vercel.app";

  const staticPages = ["", "/search", "/about", "/blog", "/privacy-policy", "/terms-of-service"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // State landing pages
  const statePages: MetadataRoute.Sitemap = Object.entries(STATE_NAMES).map(([, name]) => ({
    url: `${baseUrl}/therapists/${name.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Specialty landing pages
  const specialtyPages: MetadataRoute.Sitemap = SPECIALTY_LIST.map((s) => ({
    url: `${baseUrl}/specialties/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  // Individual therapist listing pages
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const therapists = await getAllTherapists();
    listingPages = therapists.map((listing) => ({
      url: `${baseUrl}/listings/${listing.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.error("Sitemap: failed to fetch therapists:", err);
  }

  return [...staticPages, ...statePages, ...specialtyPages, ...blogPages, ...listingPages];
}
