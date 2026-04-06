import { getSupabase } from "@/lib/supabase";

export interface Therapist {
  id: string;
  name: string;
  credentials: string | null;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  specialties: string | null;
  insurance: string | null;
  session_type: string | null;
  bio_snippet: string | null;
  source: string | null;
  scraped_at: string | null;
  telehealth: string;
  session_rate: string;
  is_verified: boolean;
  confidence: number;
  reason: string | null;
}

export interface TherapistListing {
  id: string;
  slug: string;
  name: string;
  title: string;
  specialty: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website?: string;
  rating?: number;
  reviews?: number;
  accepting_new: boolean;
  telehealth: boolean;
  insurance?: string[];
  bio?: string;
  session_rate?: string;
}

export function slugify(name: string, city: string, state: string): string {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `${normalize(name)}-${normalize(city)}-${normalize(state)}`;
}

function mapToListing(t: Therapist): TherapistListing {
  return {
    id: t.id,
    slug: slugify(t.name, t.city, t.state),
    name: t.name,
    title: t.credentials || "Therapist",
    specialty: t.specialties || "",
    address: "",
    city: t.city,
    state: t.state,
    zip: "",
    phone: t.phone || "",
    website: t.website || undefined,
    rating: undefined,
    reviews: undefined,
    accepting_new: false,
    telehealth: t.telehealth === "yes",
    insurance: t.insurance ? t.insurance.split(",").map((s) => s.trim()).filter(Boolean) : [],
    bio: t.bio_snippet || undefined,
    session_rate: t.session_rate,
  };
}

export async function getAllTherapists(): Promise<TherapistListing[]> {
  const { data, error } = await getSupabase()
    .from("therapists")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching therapists:", error);
    return [];
  }

  return (data as Therapist[]).map(mapToListing);
}

export async function getTherapistBySlug(slug: string): Promise<TherapistListing | null> {
  const { data, error } = await getSupabase()
    .from("therapists")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching therapist by slug:", error);
    return null;
  }

  const all = data as Therapist[];
  const match = all.find((t) => slugify(t.name, t.city, t.state) === slug);
  return match ? mapToListing(match) : null;
}

export async function getFeaturedTherapists(limit = 6): Promise<TherapistListing[]> {
  const all = await getAllTherapists();
  return all.slice(0, limit);
}

export async function getNearbyTherapists(
  state: string,
  excludeSlug: string,
  limit = 3
): Promise<TherapistListing[]> {
  const { data, error } = await getSupabase()
    .from("therapists")
    .select("*")
    .eq("state", state)
    .order("name")
    .limit(limit + 1);

  if (error) return [];

  return (data as Therapist[])
    .map(mapToListing)
    .filter((t) => t.slug !== excludeSlug)
    .slice(0, limit);
}

export async function searchTherapists(
  state?: string,
  specialty?: string,
  search?: string
): Promise<TherapistListing[]> {
  let query = getSupabase().from("therapists").select("*").order("name");

  if (state) {
    query = query.eq("state", state);
  }
  if (specialty) {
    query = query.ilike("specialties", `%${specialty}%`);
  }
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return (data as Therapist[]).map(mapToListing);
}
