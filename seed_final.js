const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  // Step 1: Parse TS file using tsx
  console.log('Parsing seed data...');
  try {
    const result = execSync('npx tsx -e "import { KNOWLEDGE_SEED } from \'./lib/knowledge/seed-data.ts\'; process.stdout.write(JSON.stringify(KNOWLEDGE_SEED));"', {
      cwd: 'C:\\Users\\blunt\\Desktop\\apps\\1_NEARLY_DONE_80+\\expunge',
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf8'
    });
    const seedData = JSON.parse(result);
    console.log(`Parsed ${seedData.length} entries`);

    // Step 2: Insert into Supabase
    const admin = createClient(
      'https://axzepqtovatvxhnaupgf.supabase.co',
      'eyJhbG...bKto'
    );

    const batchSize = 25;
    let inserted = 0;

    for (let i = 0; i < seedData.length; i += batchSize) {
      const batch = seedData.slice(i, i + batchSize).map(item => ({
        category: item.category,
        subcategory: item.subcategory || null,
        title: item.title,
        content: item.content,
        source: item.source || null,
        year: item.year || null,
        dispute_types: item.dispute_types || [],
        bureaus: item.bureaus || [],
        tags: item.tags || [],
        effectiveness_score: item.effectiveness_score || null,
      }));

      const { data, error } = await admin.from('dispute_knowledge_base').insert(batch).select();

      if (error) {
        console.error(`Batch ${Math.floor(i/batchSize) + 1}:`, JSON.stringify(error).substring(0, 200));
      } else {
        inserted += data.length;
        console.log(`  Batch ${Math.floor(i/batchSize) + 1}: ${data.length} entries`);
      }
    }

    console.log(`\nSeeded ${inserted} knowledge base entries!`);
  } catch (e) {
    console.error('Error:', e.message?.substring(0, 500));
  }
}

main();
