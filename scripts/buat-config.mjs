// Menulis js/core/config.js dari .env: node --env-file=.env scripts/buat-config.mjs
// Hanya dua nilai publik ini yang boleh sampai ke browser. Jangan tambahkan kunci secret di sini.
import { writeFileSync } from 'node:fs';

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY harus ada di .env');
}
writeFileSync(
  new URL('../js/core/config.js', import.meta.url),
  `/* Dibuat oleh scripts/buat-config.mjs, jangan diubah manual. */
const SUPABASE_URL = ${JSON.stringify(SUPABASE_URL)},
  SUPABASE_PUBLISHABLE_KEY = ${JSON.stringify(SUPABASE_PUBLISHABLE_KEY)};
`,
);
console.log('js/core/config.js ditulis');
