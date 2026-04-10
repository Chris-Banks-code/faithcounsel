/**
 * import_therapists.ts
 * Imports a CSV of therapists into the Supabase therapists table.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/import_therapists.ts --csv=data/npi-faith-2026-04-09.csv
 *
 * Flags:
 *   --csv=<path>   Path to CSV file (default: data/master-enriched.csv)
 *   --clear        Delete ALL existing rows first (default: append only)
 *   --dry-run      Parse CSV and print count without inserting
 *
 * CSV must have these columns (same as master-raw.csv):
 *   name, credentials, city, state, phone, website, specialties,
 *   insurance, session_type, bio_snippet, source, scraped_at
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("  SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// ─── CLI args ─────────────────────────────────────────────────────────────────

const getArg = (k: string) =>
  process.argv.find(a => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");

const csvArg = getArg("csv") ?? "data/master-enriched.csv";
const CLEAR_FIRST = process.argv.includes("--clear");
const DRY_RUN = process.argv.includes("--dry-run");

// ─── CSV parser (no extra deps) ───────────────────────────────────────────────

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Parse a single CSV line respecting quoted fields
  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length < 2) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });
    rows.push(row);
  }

  return rows;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTitleCase(s: string): string {
  if (!s) return s;
  // Only convert if all-caps (NPI Registry returns uppercase names)
  if (s === s.toUpperCase()) {
    return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  return s;
}

// ─── Import ───────────────────────────────────────────────────────────────────

async function importTherapists(rows: Record<string, string>[]) {
  console.log(`Importing ${rows.length} therapists...`);

  const therapists = rows
    .filter(row => row.name && row.state)
    .map(row => {
      const name = toTitleCase(row.name);
      const city = toTitleCase(row.city ?? "");
      const state = (row.state ?? "").toUpperCase().trim();

      return {
        name,
        credentials: row.credentials || null,
        city,
        state,
        phone: row.phone || null,
        website: row.website || null,
        specialties: row.specialties || null,
        insurance: row.insurance || null,
        session_type: row.session_type || "In-person and online",
        bio_snippet: row.bio_snippet || null,
        source: row.source || "NPI Registry",
        scraped_at: row.scraped_at || new Date().toISOString().slice(0, 10),
        telehealth: "unknown",
        session_rate: "unavailable",
      };
    });

  if (DRY_RUN) {
    console.log("\n[DRY RUN] First 5 records:");
    therapists.slice(0, 5).forEach((t, i) =>
      console.log(`  ${i + 1}. ${t.name} · ${t.city}, ${t.state} · slug: ${t.slug}`)
    );
    console.log(`\n[DRY RUN] Would insert ${therapists.length} records. Exiting.`);
    return { imported: 0, errors: 0 };
  }

  const chunkSize = 50;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < therapists.length; i += chunkSize) {
    const chunk = therapists.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("therapists")
      .insert(chunk)
      .select();

    if (error) {
      console.error(`  Batch ${Math.floor(i / chunkSize) + 1} error:`, error.message);
      errors += chunk.length;
    } else {
      const count = data?.length ?? chunk.length;
      imported += count;
      console.log(`  Batch ${Math.floor(i / chunkSize) + 1}: ✓ ${count} rows`);
    }
  }

  return { imported, errors };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = path.resolve(process.cwd(), csvArg);
  console.log("CSV path:", csvPath);

  if (!fs.existsSync(csvPath)) {
    console.error("File not found:", csvPath);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(content);
  console.log(`Loaded ${rows.length} rows from CSV`);

  if (rows.length === 0) {
    console.error("No rows found in CSV. Check the file.");
    process.exit(1);
  }

  if (CLEAR_FIRST) {
    console.log("Clearing existing therapists table...");
    const { error } = await supabase
      .from("therapists")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) console.error("  Warning: clear failed:", error.message);
    else console.log("  Cleared.");
  }

  const { imported, errors } = await importTherapists(rows);

  const { count } = await supabase
    .from("therapists")
    .select("*", { count: "exact", head: true });

  console.log(`\nImport complete:`);
  console.log(`  Imported/updated: ${imported}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total in database: ${count}`);

  process.exit(errors > 0 ? 1 : 0);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
