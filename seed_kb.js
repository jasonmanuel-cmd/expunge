const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');

const lines = readFileSync('C:\\Users\\blunt\\Desktop\\supabase.txt', 'utf8').split('\n');
const serviceKey = lines[6].trim();

const admin = createClient(
  'https://axzepqtovatvxhnaupgf.supabase.co',
  serviceKey
);

async function seedKnowledgeBase() {
  console.log('=== Seeding Knowledge Base ===\n');

  // Check if already seeded
  const { count } = await admin.from('dispute_knowledge_base').select('*', { count: 'exact', head: true });
  console.log(`Current entries: ${count}`);

  if (count > 0) {
    console.log('Knowledge base already seeded. Skipping.');
    return;
  }

  // Read the seed data TS file and extract the JSON
  const tsContent = readFileSync('C:\\Users\\blunt\\Desktop\\apps\\1_NEARLY_DONE_80+\\expunge\\lib\\knowledge\\seed-data.ts', 'utf8');
  
  // Extract the KNOWLEDGE_SEED array
  const match = tsContent.match(/export const KNOWLEDGE_SEED: KnowledgeRecord\[\] = \[([\s\S]*?)\];/);
  if (!match) {
    console.log('❌ Could not extract seed data from TS file');
    return;
  }

  // Try to parse as JSON (it's close to JSON)
  try {
    // Convert TS object notation to JSON
    let jsonStr = match[1]
      .replace(/(\w+):/g, '"$1":')  // Quote keys
      .replace(/'/g, '"')            // Replace single quotes
      .replace(/,\s*]/g, ']')        // Remove trailing commas
      .replace(/,\s*}/g, '}');
    
    const seedData = JSON.parse('[' + jsonStr + ']');
    console.log(`Parsed ${seedData.length} entries from seed data`);

    // Insert in batches
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
        console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, error.message.substring(0, 100));
      } else {
        inserted += data.length;
        console.log(`  Batch ${Math.floor(i/batchSize) + 1}: ${data.length} entries`);
      }
    }

    console.log(`\n✅ Seeded ${inserted} knowledge base entries!`);
  } catch (e) {
    // If parsing fails, use a simpler approach — call the API endpoint
    console.log('Direct parse failed, trying API endpoint...');
    console.log('Run this in PowerShell:');
    console.log(`Invoke-RestMethod -Uri "https://expunge-tau.vercel.app/api/admin/seed-knowledge" -Method POST -Headers @{"x-admin-secret" = "86b4c0dd3c7573f59fe65424addee121"}`);
  }
}

seedKnowledgeBase().catch(e => console.error('Fatal:', e.message));
