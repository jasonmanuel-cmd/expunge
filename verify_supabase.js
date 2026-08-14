/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');

// Read keys directly from the file to avoid any display truncation
const lines = readFileSync('C:\\Users\\blunt\\Desktop\\supabase.txt', 'utf8').split('\n');
const anonKey = lines[2].trim();
const serviceKey = lines[6].trim();

console.log(`Anon key length: ${anonKey.length}`);
console.log(`Service key length: ${serviceKey.length}`);

const SUPABASE_URL = 'https://axzepqtovatvxhnaupgf.supabase.co';
const admin = createClient(SUPABASE_URL, serviceKey);

async function verify() {
  console.log('\n=== Verifying Supabase Connection ===\n');

  // Test 1: Query plan_limits
  console.log('1. Plan limits:');
  const { data: limits, error: lErr } = await admin.from('plan_limits').select('*');
  if (lErr) {
    console.log('   ❌', lErr.message);
  } else {
    console.log('   ✅', limits.length, 'plans found');
    limits.forEach(l => console.log(`      ${l.plan}: ${l.max_cases} cases`));
  }

  // Test 2: Query profiles
  console.log('2. Profiles table:');
  const { error: pErr } = await admin.from('profiles').select('*').limit(1);
  console.log(pErr ? `   ❌ ${pErr.message}` : '   ✅ Table accessible');

  // Test 3: Query subscriptions
  console.log('3. Subscriptions table:');
  const { error: sErr } = await admin.from('subscriptions').select('*').limit(1);
  console.log(sErr ? `   ❌ ${sErr.message}` : '   ✅ Table accessible');

  // Test 4: Knowledge base
  console.log('4. Knowledge base:');
  const { count, error: kErr } = await admin.from('dispute_knowledge_base').select('*', { count: 'exact', head: true });
  if (kErr) {
    console.log('   ❌', kErr.message);
  } else {
    console.log('   ✅', count, 'entries');
  }

  // Test 5: Check profiles has new columns
  console.log('5. New profile columns:');
  const { data: test, error: tErr } = await admin.from('profiles').select('address_line1, ssn_last4, date_of_birth').limit(1);
  if (tErr) {
    console.log('   ❌', tErr.message);
  } else {
    console.log('   ✅ New columns exist');
  }

  console.log('\n=== Verification Complete ===');
}

verify().catch(e => console.error('Fatal:', e.message));
