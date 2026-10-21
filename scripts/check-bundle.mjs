// Runs after `npm run build`. Looks for secrets or server modules in .next/static (what reaches the browser).
// 1) Sensitive names: DATABASE_URL, BLOB_READ_WRITE_TOKEN, ADMIN_EMAILS, password_hash, bcrypt.
//    Exception: the @vercel/blob client mentions the NAME "BLOB_READ_WRITE_TOKEN" in its own
//    error message ("No blob credentials found…"); that exposes no value.
// 2) Real values: if the variables are set at build time, their literal value is searched for.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const dir = join(root, '.next', 'static');
// Secret variable NAMES come from the same file the server env schema and the redactor use.
const SECRET_NAMES = JSON.parse(readFileSync(join(root, 'src', 'server', 'env', 'secrets.json'), 'utf8'));
const NEEDLES = [
  ...SECRET_NAMES,
  'password_hash',
  'bcrypt',
  'server-only',
  '@/server',
  'INTEGRATION_',
  'UPSTASH',
  'SENTRY_DSN',
];
const LIBRARY_ALLOW = { BLOB_READ_WRITE_TOKEN: 'No blob credentials found' };
const SECRET_VALUES = SECRET_NAMES.map((name) => ({ name, value: process.env[name]?.trim() })).filter(
  (s) => s.value && s.value.length >= 8,
);

// Only NEXT_PUBLIC_SITE_URL may be public. Look for any other NEXT_PUBLIC_ name in .env* files and the env schema.
const ALLOWED_PUBLIC = 'NEXT_PUBLIC_SITE_URL';
// Names the @vercel/blob client itself reads (library code, not variables of this app).
// Same rule as the env schema: platform/library-injected names (Vercel system vars, Next, @vercel/blob).
const isLibraryPublic = (name) => name === 'NEXT_PUBLIC_DEBUG' || name.startsWith('NEXT_PUBLIC_VERCEL_');
const publicViolations = [];
for (const name of readdirSync(root)) {
  if (!/^\.env/.test(name) || name === '.env.example') continue;
  if (!statSync(join(root, name)).isFile()) continue;
  for (const [i, line] of readFileSync(join(root, name), 'utf8').split('\n').entries()) {
    const m = line.match(/^\s*(?:export\s+)?(NEXT_PUBLIC_[A-Za-z0-9_]*)\s*=/);
    if (m && m[1] !== ALLOWED_PUBLIC && !isLibraryPublic(m[1])) publicViolations.push(`${name}:${i + 1}  ${m[1]}`);
  }
}
for (const name of ['.env.example']) {
  const f = join(root, name);
  if (!existsSync(f)) continue;
  for (const [i, line] of readFileSync(f, 'utf8').split('\n').entries()) {
    const m = line.match(/^\s*#?\s*(NEXT_PUBLIC_[A-Za-z0-9_]*)\s*=/);
    if (m && m[1] !== ALLOWED_PUBLIC && !isLibraryPublic(m[1])) publicViolations.push(`${name}:${i + 1}  ${m[1]}`);
  }
}
const schemaFile = join(root, 'src', 'server', 'env', 'schema.ts');
if (existsSync(schemaFile)) {
  for (const [i, line] of readFileSync(schemaFile, 'utf8').split('\n').entries()) {
    for (const m of line.matchAll(/\b(NEXT_PUBLIC_[A-Z0-9_]+)\b/g)) {
      if (m[1] !== ALLOWED_PUBLIC && !isLibraryPublic(m[1]) && !line.includes('NEXT_PUBLIC_DEBUG') && !line.trim().startsWith('//') && !line.includes('NEXT_PUBLIC_*')) {
        publicViolations.push(`src/server/env/schema.ts:${i + 1}  ${m[1]}`);
      }
    }
  }
}
if (publicViolations.length) {
  console.error(`check:bundle — NEXT_PUBLIC_ variables other than ${ALLOWED_PUBLIC}:\n  ${publicViolations.join('\n  ')}`);
  process.exit(1);
}

if (!existsSync(dir)) {
  console.error('check:bundle — no existe .next/static. Corre `npm run build` primero.');
  process.exit(1);
}

function walk(d, out = []) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const hits = [];
const allowed = [];
const files = walk(dir);
for (const file of files) {
  const rel = relative(root, file);
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const needle of NEEDLES) {
      if (!line.includes(needle)) continue;
      const marker = LIBRARY_ALLOW[needle];
      if (marker && line.includes(marker) && line.split(needle).length - 1 <= 2) {
        allowed.push(`${rel}:${i + 1}  "${needle}" (nombre dentro del cliente de @vercel/blob)`);
        continue;
      }
      hits.push(`${rel}:${i + 1}  contiene "${needle}"`);
    }
    for (const m of line.matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) {
      if (m[0] !== ALLOWED_PUBLIC && !isLibraryPublic(m[0])) hits.push(`${rel}:${i + 1}  contiene ${m[0]}`);
    }
    for (const s of SECRET_VALUES) {
      if (line.includes(s.value)) hits.push(`${rel}:${i + 1}  contiene el VALOR de ${s.name}`);
    }
  });
}

if (allowed.length) console.log(`check:bundle — permitido:\n  ${allowed.join('\n  ')}`);
if (hits.length) {
  console.error(`check:bundle — ${hits.length} coincidencia(s):\n${hits.join('\n')}`);
  process.exit(1);
}
console.log(
  `check:bundle OK — ${files.length} archivos en .next/static sin secretos ni módulos de servidor` +
    (SECRET_VALUES.length ? ` (también se buscaron los valores de ${SECRET_VALUES.map((s) => s.name).join(', ')})` : ''),
);
