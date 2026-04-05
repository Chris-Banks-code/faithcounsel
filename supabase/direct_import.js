const { Client } = require('pg');
const fs = require('fs');
const { parse } = require('csv-parse');

const client = new Client({
  host: 'db.nkxllcalagepezbtxgno.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '507086999Cp@',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to Postgres');

  // Clear existing rows
  await client.query('DELETE FROM therapists');
  console.log('Cleared existing rows');

  // Load CSV
  const rows = await new Promise((res, rej) => {
    const rows = [];
    fs.createReadStream('/root/.openclaw/workspace/ford/data/master-enriched.csv')
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', r => rows.push(r))
      .on('end', () => res(rows))
      .on('error', rej);
  });
  console.log('Loaded', rows.length, 'rows from CSV');

  // Insert in batches of 10
  const batchSize = 10;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const params = batch.flatMap(r => [
      r.name,
      r.credentials || null,
      r.city,
      r.state,
      r.phone || null,
      r.website || null,
      r.specialties || null,
      r.insurance || null,
      r.session_type || null,
      r.bio_snippet || null,
      r.source || 'Psychology Today',
      r.scraped_at || null,
      r.telehealth || 'unknown',
      r.session_rate || 'unavailable',
    ]);

    const placeholders = batch.map((_, idx) => {
      const o = idx * 14;
      return `(\$${o+1}, \$${o+2}, \$${o+3}, \$${o+4}, \$${o+5}, \$${o+6}, \$${o+7}, \$${o+8}, \$${o+9}, \$${o+10}, \$${o+11}, \$${o+12}, \$${o+13}, \$${o+14})`;
    }).join(',');

    const query = `INSERT INTO therapists (name, credentials, city, state, phone, website, specialties, insurance, session_type, bio_snippet, source, scraped_at, telehealth, session_rate) VALUES ${placeholders}`;

    try {
      await client.query(query, params);
      inserted += batch.length;
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: +${batch.length} (total: ${inserted})`);
    } catch (e) {
      console.error(`Batch error: ${e.message}`);
    }
  }

  // Verify
  const count = await client.query('SELECT COUNT(*) FROM therapists');
  console.log(`\n✅ Import complete. Final count: ${count.rows[0].count} rows`);

  await client.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
