const { createClient } = require('@supabase/supabase-js');
const { readFileSync, writeFileSync } = require('fs');

const SUPABASE_URL = 'https://axzepqtovatvxhnaupgf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbG...bKto';

// Read the TS file and convert to a JS module we can require
const tsContent = readFileSync('C:\\Users\\blunt\\Desktop\\apps\\1_NEARLY_DONE_80+\\expunge\\lib\\knowledge\\seed-data.ts', 'utf8');

// Strip TypeScript types and export as JS
const jsContent = tsContent
  .replace(/export interface KnowledgeRecord \{[^}]+\}/s, '')
  .replace(/export const KNOWLEDGE_SEED: KnowledgeRecord\[\] =/, 'module.exports.KNOWLEDGE_SEED =')
  .replace(/(\w+): string/g, '"$1":')
  .replace(/(\w+): number/g, '"$1":')
  .replace(/(\w+): string\[\]/g, '"$1":')
  .replace(/(\w+): number\[\]/g, '"$1":')
  .replace(/(\w+)\?:/g, '"$1":');

writeFileSync('/tmp/seed-data.js', jsContent);

try {
  const { KNOWLEDGE_SEED } = require('/tmp/seed-data.js');
  console.log(`Loaded ${KNOWLEDGE_SEED.length} entries`);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Insert in batches
  const batchSize = 25;
  let inserted = 0;

  for (let i = 0; i < KNOWLEDGE_SEED.length; i += batchSize) {
    const batch = KNOWLEDGE_SEED.slice(i, i + batchSize).map(item => ({
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
} catch (e) {
  console.error('Error:', e.message);
}
