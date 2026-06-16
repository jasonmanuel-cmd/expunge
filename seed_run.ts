// Seed knowledge base - run with: npx tsx seed_run.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Load .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const eqIdx = trimmed.indexOf('=');
    const key = trimmed.substring(0, eqIdx);
    const value = trimmed.substring(eqIdx + 1).replace(/\r$/, '');
    env[key] = value;
    process.env[key] = value;
  }
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://axzepqtovatvxhnaupgf.supabase.co';
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'] || '';

async function main() {
  console.log('=== Seeding Knowledge Base ===');
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  // Dynamically import the seed data (strip TS types)
  const tsContent = fs.readFileSync('lib/knowledge/seed-data.ts', 'utf8');

  // Write a temp JS version
  const jsContent = tsContent
    .replace(/export interface KnowledgeRecord \{[\s\S]*?\},?/m, '')
    .replace(/export const KNOWLEDGE_SEED: KnowledgeRecord\[\] =/, 'module.exports.KNOWLEDGE_SEED =');

  fs.writeFileSync('/tmp/seed-data-js.js', jsContent);

  let KNOWLEDGE_SEED: unknown[];
  try {
    const mod = require('/tmp/seed-data-js.js');
    KNOWLEDGE_SEED = mod.KNOWLEDGE_SEED;
  } catch {
    // If require fails due to template literals, just inline the data
    console.log('Direct require failed, extracting array manually...');
    
    // Find between export const KNOWLEDGE_SEED = [ ... ];
    const start = tsContent.indexOf('export const KNOWLEDGE_SEED');
    const arrStart = tsContent.indexOf('[', start);
    
    // Find matching ] by counting brackets
    let depth = 0, arrEnd = -1;
    for (let i = arrStart; i < tsContent.length; i++) {
      if (tsContent[i] === '[') depth++;
      if (tsContent[i] === ']') { depth--; if (depth === 0) { arrEnd = i; break; } }
    }
    
    const arrayStr = tsContent.substring(arrStart, arrEnd + 1);
    
    // Use Function constructor to evaluate JS array (handles template literals)
    // First strip TS type annotations
    const cleanJs = arrayStr
      .replace(/:\s*string\[\]/g, '')
      .replace(/:\s*number\[\]/g, '')
      .replace(/:\s*string/g, '')
      .replace(/:\s*number/g, '')
      .replace(/,\n\s*\}/g, '}')
      .replace(/,\n\s*]/g, ']');

    try {
      const evaluate = new Function(`"use strict"; return ${cleanJs}`);
      KNOWLEDGE_SEED = evaluate();
    } catch (e) {
      // Last resort: eval
      KNOWLEDGE_SEED = eval(cleanJs);
    }
  }

  console.log(`Entries to seed: ${(KNOWLEDGE_SEED as unknown[]).length}`);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Check existing
  // Skip count check - RLS may block, just upsert

  const batchSize = 25;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < (KNOWLEDGE_SEED as unknown[]).length; i += batchSize) {
    const batch = (KNOWLEDGE_SEED as Record<string, unknown>[]).slice(i, i + batchSize).map(item => ({
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
      if (errors <= 3) console.error(`Batch ${Math.floor(i/batchSize) + 1}:`, JSON.stringify(error).substring(0, 300));
    } else {
      inserted += data?.length ?? 0;
      console.log(`  Batch ${Math.floor(i/batchSize) + 1}: ${data?.length ?? 0} entries`);
    }
  }

  console.log(`\n=== DONE: ${inserted} entries seeded, ${errors} batch errors ===`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
