// Use ts-node to evaluate the TS file and output JSON as stdout
const { execSync } = require('child_process');
const { readFileSync } = require('fs');

// Create a small script that imports the TS and outputs JSON
const evalScript = `
const path = require('path');
// Register ts-node
require('ts-node').register({ transpileOnly: true });
const { KNOWLEDGE_SEED } = require('C:\\\\Users\\\\blunt\\\\Desktop\\\\apps\\\\1_NEARLY_DONE_80+\\\\expunge\\\\lib\\\\knowledge\\\\seed-data.ts');
process.stdout.write(JSON.stringify(KNOWLEDGE_SEED));
`;

const fs = require('fs');
fs.writeFileSync('/tmp/eval-seed.js', evalScript);

try {
  const result = execSync('node /tmp/eval-seed.js', { 
    cwd: 'C:\\Users\\blunt\\Desktop\\apps\\1_NEARLY_DONE_80+\\expunge',
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024 
  });
  const seedData = JSON.parse(result.toString());
  console.log(`Parsed ${seedData.length} entries`);
  console.log('First entry:', seedData[0]?.title);
  
  // Now seed to Supabase
  const { createClient } = require('@supabase/supabase-js');
  const admin = createClient(
    'https://axzepqtovatvxhnaupgf.supabase.co',
    'eyJhbG...bKto'
  );

  const batchSize = 25;
  let inserted = 0;

  async function insertAll() {
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
        console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, JSON.stringify(error).substring(0, 200));
      } else {
        inserted += data.length;
        console.log(`  Batch ${Math.floor(i/batchSize) + 1}: ${data.length} entries`);
      }
    }
    console.log(`\nSeeded ${inserted} knowledge base entries!`);
  }

  insertAll().catch(e => console.error('Insert error:', e.message));
} catch (e) {
  console.error('Parse error:', e.message);
  console.log(e.stderr?.toString()?.substring(0, 500));
}
