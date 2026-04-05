/**
 * supabase_import.ts
 * Stage 5: Import master-enriched.csv into Supabase therapists table
 * Run: npx tsx supabase_import.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse";

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

interface TherapistRow {
  name: string;
  credentials: string;
  city: string;
  state: string;
  phone: string;
  website: string;
  specialties: string;
  insurance: string;
  session_type: string;
  bio_snippet: string;
  source: string;
  scraped_at: string;
  telehealth: string;
  session_rate: string;
}

async function loadCSV(filePath: string): Promise<TherapistRow[]> {
  return new Promise((resolve, reject) => {
    const rows: TherapistRow[] = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on("data", (row: TherapistRow) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function importTherapists(rows: TherapistRow[]) {
  console.log(`Importing ${rows.length} therapists...`);

  const therapists = rows.map((row) => ({
    name: row.name,
    credentials: row.credentials || null,
    city: row.city,
    state: row.state,
    phone: row.phone || null,
    website: row.website || null,
    specialties: row.specialties || null,
    insurance: row.insurance || null,
    session_type: row.session_type || null,
    bio_snippet: row.bio_snippet || null,
    source: row.source || "Psychology Today",
    scraped_at: row.scraped_at || null,
    telehealth: row.telehealth || "unknown",
    session_rate: row.session_rate || "unavailable",
  }));

  // Batch insert in chunks of 50
  const chunkSize = 50;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < therapists.length; i += chunkSize) {
    const chunk = therapists.slice(i, i + chunkSize);
    const { data, error } = await supabase.from("therapists").insert(chunk).select();

    if (error) {
      console.error(`  Batch ${Math.floor(i / chunkSize) + 1} error:`, error.message);
      errors += chunk.length;
    } else {
      imported += data?.length ?? chunk.length;
      console.log(
        `  Batch ${Math.floor(i / chunkSize) + 1}: +${data?.length ?? chunk.length} rows`
      );
    }
  }

  return { imported, errors };
}

async function main() {
  const csvPath = path.resolve(__dirname, "data/master-enriched.csv");
  console.log("Loading CSV from:", csvPath);

  const rows = await loadCSV(csvPath);
  console.log(`Loaded ${rows.length} rows from CSV`);

  // Clear existing data
  const { error: deleteError } = await supabase
    .from("therapists")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) {
    console.log("Note: Could not clear table:", deleteError.message);
  } else {
    console.log("Cleared existing therapists table");
  }

  const { imported, errors } = await importTherapists(rows);

  console.log(`\nImport complete:`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Errors: ${errors}`);

  // Verify count
  const { count } = await supabase
    .from("therapists")
    .select("*", { count: "exact", head: true });
  console.log(`  Total in database: ${count}`);

  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
