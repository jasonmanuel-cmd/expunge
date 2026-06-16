const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const updated = content
  .replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/g, 'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...IjXg')
  .replace(/SUPABASE_SERVICE_ROLE_KEY=.*/g, 'SUPABASE_SERVICE_ROLE_KEY=eyJhbG...bKto');
fs.writeFileSync('.env.local', updated);
console.log('Done. Keys updated.');
