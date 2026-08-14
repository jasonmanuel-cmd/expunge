/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');

const SUPABASE_URL = 'https://axzepqtovatvxhnaupgf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbG...bKto';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seedKnowledgeBase() {
  console.log('=== Seeding Knowledge Base ===\n');

  // Read and parse the TS seed data
  const tsContent = readFileSync('C:\\Users\\blunt\\Desktop\\apps\\1_NEARLY_DONE_80+\\expunge\\lib\\knowledge\\seed-data.ts', 'utf8');

  // Extract the array content
  const startIdx = tsContent.indexOf('export const KNOWLEDGE_SEED: KnowledgeRecord[] = [');
  if (startIdx === -1) {
    console.log('Could not find KNOWLEDGE_SEED');
    return;
  }

  const arrayStart = tsContent.indexOf('[', startIdx);
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

  // Split into individual objects by finding top-level { } blocks
  const objects = [];
  depth = 0;
  let objStart = -1;
  for (let i = 0; i < arrayContent.length; i++) {
    const ch = arrayContent[i];
    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    }
    if (ch === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        objects.push(arrayContent.substring(objStart + 1, i));
        objStart = -1;
      }
    }
  }

  console.log(`Found ${objects.length} objects`);

  // Parse each object
  const seedData = [];
  for (const obj of objects) {
    try {
      // Convert TS object to JSON
      let jsonStr = obj;
      // Quote unquoted keys (word followed by colon, not inside a string)
      jsonStr = jsonStr.replace(/(?:^|[\s,{])(\w[\w\s]*?):/g, (match, key) => {
        const trimmed = key.trim();
        if (trimmed.startsWith('"')) return match;
        return match[0] + '"' + trimmed + '":';
      });
      // Replace single quotes with double quotes
      jsonStr = jsonStr.replace(/'/g, '"');
      // Convert template literals
      jsonStr = jsonStr.replace(/`([^`]*)`/g, (match, content) => {
        return '"' + content.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '') + '"';
      });
      // Remove trailing commas
      jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

      const parsed = JSON.parse('{' + jsonStr + '}');
      if (parsed.category && parsed.title) {
        seedData.push(parsed);
      }
    } catch (e) {
      // skip unparseable objects
    }
  }

  console.log(`Parsed ${seedData.length} valid entries`);

  if (seedData.length === 0) {
    console.log('No entries parsed. Debugging first object:');
    console.log(objects[0]?.substring(0, 300));
    return;
  }

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
      console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, JSON.stringify(error).substring(0, 200));
    } else {
      inserted += data.length;
      console.log(`  Batch ${Math.floor(i/batchSize) + 1}: ${data.length} entries`);
    }
  }

  console.log(`\nSeeded ${inserted} knowledge base entries!`);
}

seedKnowledgeBase().catch(e => console.error('Fatal:', e.message));
