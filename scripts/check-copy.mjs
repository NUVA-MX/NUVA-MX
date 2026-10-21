// Checks that there is no Spanish business copy inside components and pages.
// Fails on accents/ñ/¿/¡ in src/components/** and src/app/**/*.tsx (except src/app/dev).
// Also lists (without failing) literals longer than 3 words for manual review.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';

const root = process.cwd();
const SPANISH = /[áéíóúñÁÉÍÓÚÑ¿¡]/;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = [
  ...walk(join(root, 'src/components')).filter((f) => ['.ts', '.tsx', '.css'].includes(extname(f))),
  ...walk(join(root, 'src/app')).filter(
    (f) => extname(f) === '.tsx' && !relative(root, f).startsWith(['src', 'app', 'dev'].join(sep)),
  ),
];

const failures = [];
const review = [];
const LITERAL = /(['"`])((?:\\.|(?!\1).)*)\1/g;

for (const file of files) {
  const rel = relative(root, file);
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (SPANISH.test(line)) failures.push(`${rel}:${i + 1}  ${line.trim()}`);
    const t = line.trim();
    if (extname(file) === '.css') return;
    if (t.startsWith('import ') || t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
    for (const m of line.matchAll(LITERAL)) {
      const s = m[2];
      if (s.includes('--') || s.includes('var(') || s.startsWith('(max-width') || s.startsWith('(min-width')) continue;
      if (s.includes('${') || s.includes('=>')) continue;
      if (s.trim().split(/\s+/).length > 3 && /[a-zA-Z]{3}/.test(s)) {
        review.push(`${rel}:${i + 1}  ${s}`);
      }
    }
    // JSX text between tags: >real words<
    for (const m of line.matchAll(/>([^<>{}]+)</g)) {
      const s = m[1].trim();
      if (s.split(/\s+/).length > 3) review.push(`${rel}:${i + 1}  JSX: ${s}`);
    }
  });
}

if (review.length) {
  console.log(`check:copy — literales de más de 3 palabras (revisión manual, no fallan):`);
  console.log(review.map((r) => '  ' + r).join('\n'));
}
if (failures.length) {
  console.error(`\ncheck:copy — ${failures.length} línea(s) con texto en español:\n`);
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('check:copy OK — sin texto en español en src/components ni src/app');
