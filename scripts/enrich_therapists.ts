/**
 * enrich_therapists.ts
 * Enriches therapist records in Supabase with:
 *   1. Website — re-queries NPI Registry by name+state to find endpoint URLs
 *   2. Session rate — scrapes each website for fee/rate info
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/enrich_therapists.ts
 *
 * Flags:
 *   --limit=50        Max providers to process (default: all)
 *   --state=TX        Only process one state
 *   --websites-only   Skip session rate scraping
 *   --rates-only      Only try to fill session rates (skip website lookup)
 */

import { createClient } from "@supabase/supabase-js";
import * as https from "https";
import * as http from "http";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// ─── CLI ──────────────────────────────────────────────────────────────────────
const getArg = (k: string) =>
  process.argv.find(a => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");

const LIMIT = parseInt(getArg("limit") ?? "9999");
const STATE_FILTER = getArg("state")?.toUpperCase();
const WEBSITES_ONLY = process.argv.includes("--websites-only");
const RATES_ONLY = process.argv.includes("--rates-only");
const DELAY = (ms = 300) => new Promise(r => setTimeout(r, ms));

// ─── HTTP ─────────────────────────────────────────────────────────────────────
function httpGet(url: string, timeoutMs = 10000, followRedirects = 5): Promise<{ body: string; finalUrl: string }> {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36" } },
      res => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && followRedirects > 0) {
          const loc = res.headers.location;
          const absolute = loc.startsWith("http") ? loc : new URL(loc, url).href;
          httpGet(absolute, timeoutMs, followRedirects - 1).then(resolve).catch(() => resolve({ body: "", finalUrl: url }));
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          resolve({ body: "", finalUrl: url });
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => { if (chunks.reduce((s, b) => s + b.length, 0) < 500_000) chunks.push(c); });
        res.on("end", () => resolve({ body: Buffer.concat(chunks).toString("utf8"), finalUrl: url }));
        res.on("error", () => resolve({ body: "", finalUrl: url }));
      }
    );
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve({ body: "", finalUrl: url }); });
    req.on("error", () => resolve({ body: "", finalUrl: url }));
  });
}

// ─── NPI WEBSITE LOOKUP ───────────────────────────────────────────────────────
async function findWebsiteFromNPI(name: string, state: string): Promise<string> {
  const isOrg = /llc|pllc|inc|corp|center|counseling|therapy|services/i.test(name);

  const params = new URLSearchParams({ version: "2.1", state, limit: "5" });
  if (isOrg) {
    params.set("organization_name", name.slice(0, 60));
  } else {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      params.set("first_name", parts[0]);
      params.set("last_name", parts[parts.length - 1]);
    } else {
      return "";
    }
  }

  const url = `https://npiregistry.cms.hhs.gov/api/?${params}`;
  try {
    const { body } = await httpGet(url, 12000);
    if (!body) return "";
    const json = JSON.parse(body);
    const results = json.results ?? [];

    for (const r of results) {
      if (!r.endpoints) continue;
      for (const ep of r.endpoints) {
        const t = (ep.endpoint_type ?? "").toLowerCase();
        const v = ep.endpoint ?? "";
        if ((t.includes("web") || t.includes("url") || t.includes("http")) && v.startsWith("http")) {
          return v;
        }
        if (v.startsWith("http")) return v;
      }
    }
  } catch { /* ignore */ }

  return "";
}

// Follow a PT profile redirect URL to get the real practice website
async function resolvePtRedirect(ptUrl: string): Promise<string> {
  if (!ptUrl.includes("psychologytoday.com")) return ptUrl;
  // PT profile website links redirect to the therapist's real site
  const { finalUrl } = await httpGet(ptUrl, 10000);
  // If it redirected away from PT, that's the real site
  if (!finalUrl.includes("psychologytoday.com") && finalUrl.startsWith("http")) {
    return finalUrl;
  }
  return "";
}

// ─── SESSION RATE EXTRACTION ──────────────────────────────────────────────────

// Patterns that suggest a per-session fee
const RATE_PATTERNS = [
  // "$150 per session", "$150/session", "$150 per 50-min"
  /\$(\d{2,4})\s*(\/|-|per)\s*(session|hour|hr|50.min|60.min|45.min|visit)/i,
  // "session fee: $150", "fee: $150"
  /(?:session\s*fee|fee|rate|cost)\s*[:\-–]?\s*\$(\d{2,4})/i,
  // "$150 – $200 per session"
  /\$(\d{2,4})\s*(?:–|-|to)\s*\$(\d{2,4})\s*(?:per|\/)\s*session/i,
  // "sliding scale $80–$150"
  /sliding\s*scale[:\s]*\$(\d{2,4})/i,
  // "sessions are $150"
  /sessions?\s+(?:are|is|cost)\s+\$(\d{2,4})/i,
  // "$150 for individual"
  /\$(\d{2,4})\s+for\s+individual/i,
];

function extractSessionRate(html: string): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");

  for (const pattern of RATE_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      // Return a clean string like "$150/session" or "$80–$150/session"
      if (m[2] && m[2].startsWith("$")) {
        return `$${m[1]}–$${m[2]}/session`;
      }
      return `$${m[1]}/session`;
    }
  }

  // Check for sliding scale mention without a price
  if (/sliding\s*scale/i.test(text)) return "Sliding scale";

  return "";
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  // Load therapists that need enrichment
  let query = supabase
    .from("therapists")
    .select("id, name, city, state, website, session_rate, source")
    .order("state");

  if (STATE_FILTER) query = query.eq("state", STATE_FILTER);

  const { data, error } = await query;
  if (error) { console.error("Fetch error:", error.message); process.exit(1); }

  const all = data as Array<{
    id: string; name: string; city: string; state: string;
    website: string | null; session_rate: string | null; source: string | null;
  }>;

  // PT redirect links — resolve to actual website
  const ptRedirects = all.filter(t =>
    t.website?.includes("psychologytoday.com/us/profile") &&
    t.website?.endsWith("/website")
  );
  const needsWebsite = all.filter(t => !t.website || t.website === "");
  const hasRealWebsite = all.filter(t =>
    t.website?.startsWith("http") && !t.website.includes("psychologytoday.com") &&
    !t.website.includes("cobius") && !t.website.includes("therapynote.com")
  );
  const needsRate = all.filter(t =>
    (!t.session_rate || t.session_rate === "unavailable") &&
    t.website?.startsWith("http") &&
    !t.website.includes("psychologytoday.com")
  );

  console.log(`Total therapists:          ${all.length}`);
  console.log(`PT redirect links:         ${ptRedirects.length}`);
  console.log(`Missing website:           ${needsWebsite.length}`);
  console.log(`Has real website:          ${hasRealWebsite.length}`);
  console.log(`Has website, needs rate:   ${needsRate.length}`);
  console.log(`Limit: ${LIMIT}\n`);

  let websitesFound = 0;
  let ratesFound = 0;
  let updated = 0;

  // ── Phase 0: Resolve PT redirect links → real websites ───────────────────
  if (!RATES_ONLY) {
    const toResolve = ptRedirects.slice(0, LIMIT);
    console.log(`Phase 0: Resolving ${toResolve.length} Psychology Today redirect links...`);

    for (const t of toResolve) {
      const realUrl = await resolvePtRedirect(t.website!);
      if (realUrl) {
        const updates: Record<string, string> = { website: realUrl };

        if (!WEBSITES_ONLY) {
          const { body } = await httpGet(realUrl, 8000);
          const rate = body ? extractSessionRate(body) : "";
          if (rate) { updates.session_rate = rate; ratesFound++; }
          console.log(`  ✓ ${t.name} (${t.state}) → ${realUrl.slice(0, 60)}${rate ? ` | ${rate}` : ""}`);
        } else {
          console.log(`  ✓ ${t.name} (${t.state}) → ${realUrl.slice(0, 60)}`);
        }

        const { error: upErr } = await supabase.from("therapists").update(updates).eq("id", t.id);
        if (!upErr) { websitesFound++; updated++; }
        await DELAY(400);
      } else {
        // PT link didn't redirect to a real site — clear it so it's not shown
        await supabase.from("therapists").update({ website: null }).eq("id", t.id);
        await DELAY(200);
      }
    }
  }

  // ── Phase 1: Website lookup via NPI for missing ───────────────────────────
  if (!RATES_ONLY) {
    const toCheck = needsWebsite.slice(0, LIMIT - updated);
    console.log(`\nPhase 1: NPI website lookup for ${toCheck.length} providers...`);

    for (const t of toCheck) {
      const website = await findWebsiteFromNPI(t.name, t.state);
      if (website && !website.includes("cobius") && !website.includes("therapynote.com")) {
        const updates: Record<string, string> = { website };

        if (!WEBSITES_ONLY) {
          const { body } = await httpGet(website, 8000);
          const rate = body ? extractSessionRate(body) : "";
          if (rate) { updates.session_rate = rate; ratesFound++; }
          console.log(`  ✓ ${t.name} (${t.state}) → ${website.slice(0, 60)}${rate ? ` | ${rate}` : ""}`);
        } else {
          console.log(`  ✓ ${t.name} (${t.state}) → ${website.slice(0, 60)}`);
        }

        const { error: upErr } = await supabase.from("therapists").update(updates).eq("id", t.id);
        if (!upErr) { websitesFound++; updated++; }
        await DELAY(250);
      }
      await DELAY(200);
    }
  }

  // ── Phase 2: Session rate scraping for providers with real websites ────────
  if (!WEBSITES_ONLY) {
    const toScrape = needsRate.slice(0, LIMIT - updated);
    console.log(`\nPhase 2: Scraping session rates for ${toScrape.length} providers...`);

    for (const t of toScrape) {
      const { body } = await httpGet(t.website!, 8000);
      const rate = body ? extractSessionRate(body) : "";

      if (rate) {
        const { error: upErr } = await supabase.from("therapists").update({ session_rate: rate }).eq("id", t.id);
        if (!upErr) { ratesFound++; updated++; }
        console.log(`  ✓ ${t.name} (${t.state}) → ${rate}`);
      }
      await DELAY(300);
    }
  }

  console.log(`\n✅ Done`);
  console.log(`  Websites found:      ${websitesFound}`);
  console.log(`  Session rates found: ${ratesFound}`);
  console.log(`  Total rows updated:  ${updated}`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
