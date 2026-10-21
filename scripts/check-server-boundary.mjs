// Every non-test TypeScript file under src/server must start with `import 'server-only'`,
// so importing it from a client component fails the build.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const dir = join(root, 'src', 'server');
const IMPORT = /^\s*import\s+['"]server-only['"]\s*;?/m;

function walk(d, out = []) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) {
      if (name === '__tests__') continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

if (!existsSync(dir)) {
  console.log('check:server-boundary OK — no src/server directory');
  process.exit(0);
}

const missing = walk(dir).filter((f) => !IMPORT.test(readFileSync(f, 'utf8')));
if (missing.length) {
  console.error(`check:server-boundary — missing import 'server-only' in:\n  ${missing.map((f) => relative(root, f)).join('\n  ')}`);
  process.exit(1);
}
console.log('check:server-boundary OK — every src/server module imports server-only');
