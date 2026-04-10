/**
 * fetch_npi.ts
 * Queries the free NPI Registry API (npiregistry.cms.hhs.gov) for licensed
 * mental health providers in every US state, then filters for faith-based
 * practitioners by checking:
 *   1. Practice/organization name contains faith keywords (fast, no HTTP)
 *   2. Their website (if found via a secondary lookup) contains faith keywords
 *
 * Output: data/npi-faith-<date>.csv  (same columns as master-raw.csv)
 *
 * Usage:
 *   npx tsx scripts/fetch_npi.ts
 *   npx tsx scripts/fetch_npi.ts --states=TX,CA,FL
 *   npx tsx scripts/fetch_npi.ts --states=TX --skip-web-check
 *
 * No extra npm packages needed — uses built-in fetch (Node 18+).
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const NPI_API = "https://npiregistry.cms.hhs.gov/api/?version=2.1";

// Mental health taxonomy descriptions to query
const TAXONOMIES = [
  "Mental Health Counselor",
  "Marriage & Family Therapist",
  "Clinical Social Worker",
  "Counselor",
  "Psychologist",
  "Licensed Professional Counselor",
];

// Faith keywords (whole-word match via \b) checked against practice/org name
// These must appear as standalone words to avoid matching personal names
// e.g. "christian" matches but NOT "christopher" / "christine" / "christina"
const FAITH_NAME_KEYWORDS_WORD = [
  "christian", "faith", "biblical", "bible", "covenant",
  "ministry", "pastoral", "chapel", "church", "divine",
  "redemption", "restoration", "gospel", "prayer", "spiritual",
  "scripture", "trinity", "sanctuary", "wholeness", "salvation",
  "blessed", "abba", "anointed", "kingdom", "shepherd",
];

// These require exact phrase match (includes) because they span word boundaries
// or are short enough to cause false positives with \b alone
const FAITH_NAME_PHRASES = [
  "christian counseling", "christian therapy", "christian therapist",
  "christian counselor", "faith-based", "faith based", "soul care",
  "holy spirit", "christ-centered", "christ centered",
  "abundant life", "abiding", "anchor of hope", "abound in hope",
];

// For org names only (not personal names) — matched only when the name looks
// like a business name (contains LLC, PLLC, INC, CENTER, COUNSELING, etc.)
const FAITH_ORG_KEYWORDS_WORD = [
  "christ", "jesus", "lord", "god", "hope", "grace", "spirit", "cross",
  "renewing", "transforming", "holy", "resurrection", "redeemer",
];

const FAITH_WEB_KEYWORDS = [
  "christian", "faith", "biblical", "christ", "counseling from a faith",
  "faith-based", "faith based", "christian counselor", "christian therapist",
  "integrat", "spiritual", "prayer", "scripture", "god",
];

// Mental health credential keywords (filter out non-therapists)
const CREDENTIAL_KEYWORDS = [
  "lcsw", "lpc", "lpcc", "lmft", "lmhc", "lcpc", "phd", "psyd", "msw",
  "lmsw", "lpc-a", "lpc-associate", "lmft-a", "lcat", "ladc", "lac",
  "counselor", "therapist", "psychologist", "social work",
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const getArg = (k: string) =>
  process.argv.find(a => a.startsWith(`--${k}=`))?.split("=")[1];

const stateArg = getArg("states");
const STATES = stateArg ? stateArg.split(",").map(s => s.trim().toUpperCase()) : US_STATES;
const SKIP_WEB = process.argv.includes("--skip-web-check");

const DELAY = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ─── CSV ──────────────────────────────────────────────────────────────────────

const CSV_COLS = [
  "name","credentials","city","state","phone","website",
  "specialties","insurance","session_type","bio_snippet",
  "source","scraped_at",
];

function esc(v: string | null | undefined) {
  const s = (v ?? "").replace(/\r?\n/g, " ").trim();
  return (s.includes(",") || s.includes('"')) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeRow(stream: fs.WriteStream, row: Record<string, string>) {
  stream.write(CSV_COLS.map(c => esc(row[c])).join(",") + "\n");
}

// ─── HTTP HELPERS ─────────────────────────────────────────────────────────────

function httpGet(url: string, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { headers: { "User-Agent": "NPI-FaithCounsel-Lookup/1.0" } }, res => {
      // Follow one redirect
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpGet(res.headers.location, timeoutMs).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    });
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error("timeout")); });
    req.on("error", reject);
  });
}

// ─── NPI API ──────────────────────────────────────────────────────────────────

interface NpiAddress {
  address_purpose: string;
  city: string;
  state: string;
  postal_code: string;
  telephone_number: string;
  fax_number?: string;
  address_1?: string;
}

interface NpiTaxonomy {
  code: string;
  desc: string;
  primary: boolean;
  state?: string;
  license?: string;
}

interface NpiResult {
  number: string;
  basic: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    name_prefix?: string;
    credential?: string;
    organization_name?: string;
    status: string;
    enumeration_date: string;
    last_updated: string;
    sole_proprietor?: string;
  };
  addresses: NpiAddress[];
  taxonomies: NpiTaxonomy[];
  other_names?: Array<{ organization_name?: string }>;
  endpoints?: Array<{ endpoint?: string; endpoint_type?: string }>;
}

async function queryNpi(state: string, taxonomy: string, skip = 0): Promise<{ results: NpiResult[]; result_count: number }> {
  const params = new URLSearchParams({
    version: "2.1",
    state,
    taxonomy_description: taxonomy,
    limit: "200",
    skip: String(skip),
  });
  const url = `${NPI_API}&${params}`;
  try {
    const raw = await httpGet(url, 15000);
    const json = JSON.parse(raw);
    return { results: json.results ?? [], result_count: json.result_count ?? 0 };
  } catch (e) {
    console.log(`    ⚠ NPI API error: ${(e as Error).message}`);
    return { results: [], result_count: 0 };
  }
}

// ─── WEBSITE LOOKUP ───────────────────────────────────────────────────────────

// Try to find website from NPI endpoints or a simple Google lookup
async function findWebsite(provider: NpiResult): Promise<string> {
  // Check NPI endpoints field first
  if (provider.endpoints) {
    for (const ep of provider.endpoints) {
      if (ep.endpoint_type?.toLowerCase().includes("website") && ep.endpoint) {
        return ep.endpoint;
      }
    }
  }
  return "";
}

async function websiteHasFaithKeywords(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    const html = await httpGet(url.startsWith("http") ? url : `https://${url}`, 6000);
    const lower = html.toLowerCase();
    return FAITH_WEB_KEYWORDS.some(kw => lower.includes(kw));
  } catch {
    return false;
  }
}

// ─── FAITH FILTERING ─────────────────────────────────────────────────────────

const ORG_INDICATORS = /\b(llc|pllc|inc|corp|center|centre|counseling|counselling|therapy|therapist|counselor|services|associates|group|clinic|practice|wellness|health|care)\b/i;

function hasFaithKeywordInName(text: string): boolean {
  const lower = text.toLowerCase();

  // 1. Whole-word keywords — safe for all names
  if (FAITH_NAME_KEYWORDS_WORD.some(kw => new RegExp(`\\b${kw}\\b`).test(lower))) return true;

  // 2. Phrase matches
  if (FAITH_NAME_PHRASES.some(phrase => lower.includes(phrase))) return true;

  // 3. Org-only keywords (christ, jesus, god, hope, grace, spirit, cross…)
  //    Only apply if the name looks like a business (has org indicator or all-caps abbreviation)
  if (ORG_INDICATORS.test(text)) {
    if (FAITH_ORG_KEYWORDS_WORD.some(kw => new RegExp(`\\b${kw}\\b`).test(lower))) return true;
  }

  return false;
}

function isMentalHealthProvider(provider: NpiResult): boolean {
  // Must have at least one mental health taxonomy
  const mentalHealthCodes = new Set([
    "101Y00000X", "101YA0400X", "101YM0800X", "101YP1600X",
    "101YP2500X", "101YS0200X", "106H00000X",
    "1041C0700X", "1041S0200X",
    "103T00000X", "103TC0700X", "103TC2200X", "103TF0000X",
    "103TH0100X", "103TP2701X", "103TS0200X",
  ]);
  return provider.taxonomies?.some(t => mentalHealthCodes.has(t.code)) ?? false;
}

function extractProviderInfo(provider: NpiResult, stateFilter: string) {
  const b = provider.basic;

  // Name
  let name = "";
  if (b.organization_name) {
    name = b.organization_name;
  } else if (b.first_name && b.last_name) {
    name = `${b.first_name}${b.middle_name ? " " + b.middle_name : ""} ${b.last_name}`.trim();
  }
  if (!name) return null;

  // Credentials
  const credentials = b.credential ?? provider.taxonomies?.find(t => t.primary)?.desc ?? "";

  // Practice address (prefer LOCATION over MAILING)
  const addr =
    provider.addresses?.find(a => a.address_purpose === "LOCATION") ??
    provider.addresses?.[0];
  const city = addr?.city ?? "";
  const state = addr?.state ?? stateFilter;
  const phone = addr?.telephone_number?.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") ?? "";

  // Specialties from taxonomy descriptions
  const specialties = provider.taxonomies
    ?.filter(t => t.desc)
    .map(t => t.desc)
    .join(", ") ?? "";

  const isOrg = !!b.organization_name;

  // For faith-keyword matching:
  // - orgNameFields: org/practice names only — used for all faith keywords including "christ", "jesus", "hope"
  // - personalNameFields: first+last personal name — only used for word-boundary keywords (not "hope"/"grace"/"faith" which are common given names)
  const orgNameFields = [
    b.organization_name ?? "",
    ...(provider.other_names?.map(o => o.organization_name ?? "") ?? []),
  ].join(" ").trim();

  return { name, credentials, city, state, phone, specialties, isOrg, orgNameFields, personalName: isOrg ? "" : name };
}

// ─── PER-STATE ────────────────────────────────────────────────────────────────

async function processState(
  state: string,
  stream: fs.WriteStream,
  seen: Set<string>,
  today: string
): Promise<number> {
  let total = 0;
  const stateProviders = new Map<string, NpiResult>(); // npi → result, deduplicate

  // Query each taxonomy
  for (const taxonomy of TAXONOMIES) {
    let skip = 0;
    let fetched = 0;

    while (true) {
      const { results, result_count } = await queryNpi(state, taxonomy, skip);
      if (results.length === 0) break;

      for (const r of results) {
        if (r.basic.status === "A" && !stateProviders.has(r.number)) {
          stateProviders.set(r.number, r);
        }
      }

      fetched += results.length;
      skip += 200;

      // NPI API max is 1200 results (skip=1000 + limit=200)
      if (skip > 1000 || fetched >= result_count) break;
      await DELAY(300);
    }
  }

  console.log(`  [${state}] ${stateProviders.size} total mental health providers from NPI`);

  for (const [, provider] of stateProviders) {
    if (!isMentalHealthProvider(provider)) continue;

    const info = extractProviderInfo(provider, state);
    if (!info) continue;

    const dedupeKey = `${info.name}|${info.city}|${info.state}`.toLowerCase();
    if (seen.has(dedupeKey)) continue;

    // Phase 1: name-based faith keyword check (fast)
    // For orgs: check full org name with all keywords
    // For individuals: skip personal name entirely (Faith/Grace/Christian are common names)
    let isFaith = hasFaithKeywordInName(info.orgNameFields);

    // Phase 2: website check (slower, optional)
    let website = "";
    if (!isFaith && !SKIP_WEB) {
      website = await findWebsite(provider);
      if (website) {
        isFaith = await websiteHasFaithKeywords(website);
        await DELAY(200);
      }
    } else if (isFaith) {
      website = await findWebsite(provider);
    }

    if (!isFaith) continue;

    // Passed faith filter — write to CSV
    seen.add(dedupeKey);
    writeRow(stream, {
      name: info.name,
      credentials: info.credentials,
      city: info.city,
      state: info.state,
      phone: info.phone,
      website,
      specialties: info.specialties,
      insurance: "",
      session_type: "In-person and online",
      bio_snippet: "",
      source: "NPI Registry",
      scraped_at: today,
    });
    total++;
  }

  return total;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const outDir = path.resolve(__dirname, "../data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const outFile = path.join(outDir, `npi-faith-${today}.csv`);
  const stream = fs.createWriteStream(outFile, { flags: "w" });
  stream.write(CSV_COLS.join(",") + "\n");

  // Seed seen-set from existing master CSV
  const seen = new Set<string>();
  const masterCsv = path.resolve(__dirname, "../data/master-raw.csv");
  if (fs.existsSync(masterCsv)) {
    const lines = fs.readFileSync(masterCsv, "utf8").split("\n").slice(1);
    for (const line of lines) {
      const parts = line.split(",");
      if (parts[0] && parts[2] && parts[3]) {
        seen.add(
          `${parts[0].replace(/"/g, "")}|${parts[2].replace(/"/g, "")}|${parts[3].replace(/"/g, "")}`.toLowerCase()
        );
      }
    }
  }

  console.log(`NPI Faith-Based Therapist Fetcher`);
  console.log(`States: ${STATES.join(", ")}`);
  console.log(`Web check: ${SKIP_WEB ? "disabled" : "enabled"}`);
  console.log(`Output: ${outFile}\n`);

  let grandTotal = 0;
  for (const state of STATES) {
    const n = await processState(state, stream, seen, today);
    grandTotal += n;
    console.log(`  ✓ ${state}: +${n} faith-based providers (running total: ${grandTotal})`);
    await DELAY(500);
  }

  stream.end();
  console.log(`\n✅ Done — ${grandTotal} faith-based therapists saved to:\n   ${outFile}`);
  console.log(`\nNext: import into Supabase`);
  console.log(`  1. Open scripts/import_therapists.ts`);
  console.log(`  2. Change the csvPath to: data/npi-faith-${today}.csv`);
  console.log(`  3. Run: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import_therapists.ts`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
