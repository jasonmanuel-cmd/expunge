/* eslint-disable */
// Seed ALL knowledge base entries - run with: npx tsx seed_run2.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const eqIdx = trimmed.indexOf('=');
    process.env[trimmed.substring(0, eqIdx)] = trimmed.substring(eqIdx + 1).replace(/\r$/, '');
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://axzepqtovatvxhnaupgf.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function main() {
  console.log('=== Seeding Knowledge Base (v2) ===');

  const ts = fs.readFileSync('lib/knowledge/seed-data.ts', 'utf8');

  // Extract the array
  const s = ts.indexOf('export const KNOWLEDGE_SEED');
  const a = ts.indexOf('[', s);

  // Find matching ] by counting ALL brace/bracket depth
  let bDepth = 0, brDepth = 0, arrEnd = -1;
  for (let i = a; i < ts.length; i++) {
    if (ts[i] === '[') brDepth++;
    if (ts[i] === ']') { brDepth--; if (brDepth === 0) { arrEnd = i; break; } }
  }

  const arrayStr = ts.substring(a, arrEnd + 1);

  // Convert to valid JS: the TS uses template literals and trailing commas
  // Strategy: replace the entire content with a JSON-compatible format
  // First, let's try a different approach - use Function constructor with TS stripped

  // Remove TS type annotations from the array
  let js = arrayStr;
  // Remove type annotations like : string, : number, : string[], : number[]
  js = js.replace(/:\s*string\b/g, '');
  js = js.replace(/:\s*number\b/g, '');
  js = js.replace(/:\s*string\[\]/g, '');
  js = js.replace(/:\s*number\[\]/g, '');
  js = js.replace(/:\s*KnowledgeRecord/g, '');

  // Handle template literals -> convert to regular strings
  // Replace backtick-delimited strings with double-quoted strings
  let result = '';
  let i = 0;
  while (i < js.length) {
    if (js[i] === '`') {
      // Find matching backtick
      let j = i + 1;
      let content = '';
      while (j < js.length && js[j] !== '`') {
        if (js[j] === '\\' && js[j + 1] === '`') {
          content += '\\`';
          j += 2;
        } else if (js[j] === '\n') {
          content += '\\n';
          j++;
        } else if (js[j] === '\r') {
          j++;
        } else {
          content += js[j];
          j++;
        }
      }
      result += '"' + content.replace(/"/g, '\\"') + '"';
      i = j + 1;
    } else {
      result += js[i];
      i++;
    }
  }
  js = result;

  // Remove trailing commas
  js = js.replace(/,\s*}/g, '}');
  js = js.replace(/,\s*]/g, ']');

  // Now parse
  let entries: unknown[];
  try {
    entries = eval(js);
  } catch (e) {
    // eval might fail due to quote issues - try Function constructor
    entries = new Function(`"use strict"; return ${js}`)();
  }

  console.log(`Parsed ${entries.length} entries`);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Check existing count
  let existing = 0;
  for (let offset = 0; ; offset += 1000) {
    const { data } = await admin.from('dispute_knowledge_base').select('id').range(offset, offset + 999);
    if (!data) break;
    existing += data.length;
    if (data.length < 1000) break;
  }
  console.log(`Existing entries: ${existing}`);

  if (existing >= entries.length) {
    console.log('Already fully seeded.');
    return;
  }

  const batchSize = 25;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = (entries as Record<string, unknown>[]).slice(i, i + batchSize).map(item => ({
      category: item.category as string,
      subcategory: (item.subcategory as string) || null,
      title: item.title as string,
      content: item.content as string,
      source: (item.source as string) || null,
      year: (item.year as number) || null,
      dispute_types: (item.dispute_types as string[]) || [],
      bureaus: (item.bureaus as string[]) || [],
      tags: (item.tags as string[]) || [],
      effectiveness_score: (item.effectiveness_score as number) || null,
    }));

    const { data, error } = await admin.from('dispute_knowledge_base').insert(batch).select();

    if (error) {
      errors++;
      if (errors <= 5) console.error(`  ERR Batch ${Math.floor(i/batchSize) + 1}:`, JSON.stringify(error).substring(0, 300));
    } else {
      inserted += data?.length ?? 0;
      console.log(`  OK Batch ${Math.floor(i/batchSize) + 1}: ${data?.length ?? 0} entries`);
    }
  }

  console.log(`\n=== DONE: ${inserted} new entries, ${errors} errors ===`);
}

main().catch(e => { console.error('Fatal:', e.message, e.stack?.substring(0, 500)); process.exit(1); });
