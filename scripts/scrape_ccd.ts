/**
 * scrape_ccd.ts
 * Scrapes ChristianCounselorDirectory.com (A-Z alphabetical listing)
 * and imports results directly into Supabase.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/scrape_ccd.ts
 *
 * Flags:
 *   --dry-run      Parse and print without inserting
 *   --letters=A,B  Only scrape specific letters (default: all A-Z)
 */

import { createClient } from "@supabase/supabase-js";
import * as https from "https";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

const BASE = "https://www.christiancounselordirectory.com";
const DELAY = (ms = 600) => new Promise(r => setTimeout(r, ms));
const DRY_RUN = process.argv.includes("--dry-run");

const letterArg = process.argv.find(a => a.startsWith("--letters="))?.split("=")[1];
const LETTERS = letterArg
  ? letterArg.split(",").map(l => l.trim().toUpperCase())
  : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ─── HTTP ─────────────────────────────────────────────────────────────────────
function get(url: string): Promise<string> {
  return new Promise(resolve => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      }
    }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        get(res.headers.location.startsWith("http") ? res.headers.location : BASE + res.headers.location)
          .then(resolve).catch(() => resolve(""));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", () => resolve(""));
    });
    req.setTimeout(15000, () => { req.destroy(); resolve(""); });
    req.on("error", () => resolve(""));
  });
}

// ─── TEXT UTILS ───────────────────────────────────────────────────────────────
function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
}

function extractBetween(html: string, startTag: string, endTag: string): string {
  const start = html.indexOf(startTag);
  if (start === -1) return "";
  const end = html.indexOf(endTag, start + startTag.length);
  if (end === -1) return "";
  return html.slice(start + startTag.length, end);
}

// ─── PROFILE EXTRACTION ───────────────────────────────────────────────────────
interface CcdProfile {
  name: string;
  credentials: string;
  city: string;
  state: string;
  phone: string;
  website: string;
  specialties: string;
  bio_snippet: string;
  source_url: string;
}

function parseProfile(html: string, profileUrl: string): CcdProfile | null {
  // Practice/org name — from <h1> or page title
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ??
    html.match(/<title>([^|<]+)/i)?.[1]?.trim() ?? "";
  if (!h1 || h1.length < 3) return null;

  // Clean name (remove "| Christian Counselor Directory" suffix)
  const name = h1.replace(/\s*\|\s*Christian.*$/i, "").trim();

  // Credentials — first therapist's credentials block
  const credMatch = html.match(/<div class="Credentials">([^<]*)<\/div>/i);
  const credentials = credMatch ? stripTags(credMatch[1]) : "";

  // City & state from address section
  const addressSection = extractBetween(html, 'class="Address"', "</div>");
  const cityStateMatch = addressSection.match(/([A-Za-z\s]+),\s*([A-Z]{2})\s*\d{5}/);
  const city = cityStateMatch?.[1]?.trim() ?? "";
  const state = cityStateMatch?.[2]?.trim() ?? "";

  // Also try data in the general body
  let finalState = state;
  let finalCity = city;
  if (!finalState) {
    const stateMatch = html.match(/\b([A-Z]{2})\s+\d{5}/);
    finalState = stateMatch?.[1] ?? "";
  }
  if (!finalCity && finalState) {
    // Try to find "City, ST" pattern
    const cityMatch = html.match(/([A-Z][a-zA-Z\s]+),\s*[A-Z]{2}\s*\d{5}/);
    finalCity = cityMatch?.[1]?.trim() ?? "";
  }

  // Phone
  const phone = html.match(/(\(\d{3}\)\s*\d{3}[-.\s]\d{4})/)?.[1]?.trim() ?? "";

  // Website — any external link that isn't CCD itself, PT, or social media
  const websiteMatches = html.matchAll(/href="(https?:\/\/[^"]+)"/gi);
  let website = "";
  const skipDomains = ["christiancounselordirectory.com", "psychologytoday.com",
    "facebook.com", "twitter.com", "linkedin.com", "instagram.com",
    "youtube.com", "google.com", "aacc.net", "javascript:"];
  for (const m of websiteMatches) {
    const url = m[1];
    if (!skipDomains.some(d => url.includes(d))) {
      website = url;
      break;
    }
  }

  // Specialties — look for issues/specialties section
  const specSection = extractBetween(html, 'Issues:', "</div>") ||
    extractBetween(html, 'Specialties:', "</div>") ||
    extractBetween(html, 'Specialty:', "</div>");
  const specialties = stripTags(specSection).slice(0, 200);

  // Bio — first TherapistBio content
  const bioSection = extractBetween(html, 'class="Content">', "</div>");
  const bio = stripTags(bioSection).slice(0, 400);

  // Must have at least state to be useful
  if (!finalState) return null;

  return {
    name,
    credentials,
    city: finalCity,
    state: finalState,
    phone,
    website,
    specialties,
    bio_snippet: bio,
    source_url: profileUrl,
  };
}

// ─── SCRAPER ──────────────────────────────────────────────────────────────────

async function getProfileUrlsForLetter(letter: string): Promise<string[]> {
  const html = await get(`${BASE}/FindATherapist/AlphaDirectory.aspx?Initial=${letter}`);
  if (!html) return [];
  const matches = html.matchAll(/href="(\/Therapist\/[^"]+)"/gi);
  const urls = new Set<string>();
  for (const m of matches) {
    urls.add(BASE + m[1]);
  }
  return [...urls];
}

async function scrapeProfile(url: string): Promise<CcdProfile | null> {
  const html = await get(url);
  if (!html) return null;
  return parseProfile(html, url);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Scraping ChristianCounselorDirectory.com — letters: ${LETTERS.join("")}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "live import"}\n`);

  // Load existing records — track by name+state for dedup, and id for enrichment
  const { data: existing } = await supabase
    .from("therapists")
    .select("id, name, state, website, bio_snippet, credentials");
  const existingMap = new Map(
    (existing ?? []).map(t => [`${t.name}|${t.state}`.toLowerCase(), t])
  );
  console.log(`Existing in DB: ${existingMap.size}\n`);

  const today = new Date().toISOString().slice(0, 10);
  let totalFound = 0;
  let totalImported = 0;

  for (const letter of LETTERS) {
    const profileUrls = await getProfileUrlsForLetter(letter);
    console.log(`[${letter}] ${profileUrls.length} profiles`);

    const toInsert: Record<string, string | null>[] = [];

    for (const url of profileUrls) {
      const profile = await scrapeProfile(url);
      await DELAY(400);

      if (!profile) continue;

      const key = `${profile.name}|${profile.state}`.toLowerCase();
      const existing = existingMap.get(key);

      if (existing) {
        // Already in DB — enrich with website/bio if missing
        const updates: Record<string, string> = {};
        if (!existing.website && profile.website) updates.website = profile.website;
        if (!existing.bio_snippet && profile.bio_snippet) updates.bio_snippet = profile.bio_snippet;
        if (!existing.credentials && profile.credentials) updates.credentials = profile.credentials;

        if (Object.keys(updates).length > 0) {
          if (!DRY_RUN) {
            await supabase.from("therapists").update(updates).eq("id", existing.id);
          }
          totalImported++;
          const fields = Object.keys(updates).join(", ");
          process.stdout.write(`  ~ ${profile.name} (${profile.state}) — enriched: ${fields}\n`);
        }
        continue;
      }

      // New record
      existingMap.set(key, { id: "", name: profile.name, state: profile.state, website: profile.website, bio_snippet: profile.bio_snippet, credentials: profile.credentials });
      totalFound++;

      toInsert.push({
        name: profile.name,
        credentials: profile.credentials || null,
        city: profile.city || "",
        state: profile.state,
        phone: profile.phone || null,
        website: profile.website || null,
        specialties: profile.specialties || null,
        insurance: null,
        session_type: "In-person and online",
        bio_snippet: profile.bio_snippet || null,
        source: "ChristianCounselorDirectory",
        scraped_at: today,
        telehealth: "unknown",
        session_rate: "unavailable",
      });

      process.stdout.write(`  + ${profile.name} (${profile.state})${profile.website ? " — " + profile.website.slice(0, 50) : ""}\n`);
    }

    if (!DRY_RUN && toInsert.length > 0) {
      const { error } = await supabase.from("therapists").insert(toInsert);
      if (error) {
        console.error(`  [${letter}] Insert error:`, error.message);
      } else {
        totalImported += toInsert.length;
        console.log(`  [${letter}] ✓ inserted ${toInsert.length} new`);
      }
    } else if (DRY_RUN) {
      console.log(`  [${letter}] Would insert ${toInsert.length} new`);
    }

    await DELAY(800);
  }

  console.log(`\n✅ Done`);
  console.log(`  New profiles added:   ${totalFound}`);
  console.log(`  Records updated/added: ${totalImported}`);

  if (!DRY_RUN) {
    const { count } = await supabase.from("therapists").select("*", { count: "exact", head: true });
    console.log(`  Total in database:    ${count}`);
  }
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
