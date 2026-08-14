/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');

const SUPABASE_URL = 'https://axzepqtovatvxhnaupgf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbG...bKto';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seedKnowledgeBase() {
  console.log('=== Seeding Knowledge Base ===\n');

  // Check if already seeded
  const { count } = await admin.from('dispute_knowledge_base').select('*', { count: 'exact', head: true });
  console.log(`Current entries: ${count}`);

  if (count > 0) {
    console.log('Knowledge base already seeded. Skipping.');
    return;
  }

  // Read and parse the TS seed data
  const tsContent = readFileSync('C:\\Users\\blunt\\Desktop\\apps\\1_NEARLY_DONE_80+\\expunge\\lib\\knowledge\\seed-data.ts', 'utf8');

  // Extract the array content between [ and ];
  const startIdx = tsContent.indexOf('export const KNOWLEDGE_SEED: KnowledgeRecord[] = [');
  if (startIdx === -1) {
    console.log('Could not find KNOWLEDGE_SEED');
    return;
  }

  const arrayStart = tsContent.indexOf('[', startIdx);
  // Find matching closing bracket
  let depth = 0;
  let arrayEnd = -1;
  for (let i = arrayStart; i < tsContent.length; i++) {
    if (tsContent[i] === '[') depth++;
    if (tsContent[i] === ']') depth--;
    if (depth === 0) { arrayEnd = i; break; }
  }

  if (arrayEnd === -1) {
    console.log('Could not find end of array');
    return;
  }

  let arrayContent = tsContent.substring(arrayStart + 1, arrayEnd);

  // Convert TS to JSON
  // 1. Quote unquoted keys
  arrayContent = arrayContent.replace(/(\w[\w\s]*?):/g, (match, key) => {
    // Don't quote if already quoted or inside a string value
    const trimmed = key.trim();
    if (trimmed.startsWith('"')) return match;
    return `"${trimmed}":`;
  });

  // 2. Replace single quotes with double quotes
  arrayContent = arrayContent.replace(/'/g, '"');

  // 3. Remove trailing commas
  arrayContent = arrayContent.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  // 4. Fix template literals (backtick strings) - convert to regular strings
  arrayContent = arrayContent.replace(/`([^`]*)`/g, (match, content) => {
    return '"' + content.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '') + '"';
  });

  try {
    const seedData = JSON.parse('[' + arrayContent + ']');
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
        console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, error.message?.substring(0, 100) || error);
      } else {
        inserted += data.length;
        console.log(`  Batch ${Math.floor(i/batchSize) + 1}: ${data.length} entries`);
      }
    }

    console.log(`\nSeeded ${inserted} knowledge base entries!`);
  } catch (e) {
    console.error('Parse error:', e.message);
    console.log('\nFalling back to API endpoint...');
    console.log('Run this in PowerShell:');
    console.log(`Invoke-RestMethod -Uri "https://expunge-tau.vercel.app/api/admin/seed-knowledge" -Method POST -Headers @{"x-admin-secret" = "86b4c0dd3c7573f59fe65424addee121"}`);
  }
}

seedKnowledgeBase().catch(e => console.error('Fatal:', e.message));
