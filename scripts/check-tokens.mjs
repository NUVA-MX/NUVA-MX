// Checks that components and pages only use tokens (no raw colors or px).
// Usage: node scripts/check-tokens.mjs   (exits with code 1 on failures)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const root = process.cwd();
const TARGETS = ['src/components', 'src/app'];
const EXTS = new Set(['.css', '.tsx', '.ts']);
const ALLOWED_BREAKPOINTS = new Set(['640', '900', '1024', '1180']);
const BP_COMMENT = 'see src/styles/breakpoints.ts';

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const COLOR_FN = /\b(rgba?|hsla?)\(/;
const PX = /\b(\d+(?:\.\d+)?)px\b/g;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXTS.has(extname(p))) out.push(p);
  }
  return out;
}

const failures = [];
const fail = (file, line, msg, text) =>
  failures.push(`${relative(root, file)}:${line}  ${msg}\n    ${text.trim()}`);

function isCommentLine(t) {
  return t.startsWith('/*') || t.startsWith('*') || t.startsWith('//') || t.startsWith('{/*');
}

function badPx(text) {
  const found = [];
  for (const m of text.matchAll(PX)) {
    if (m[1] !== '0' && m[1] !== '1') found.push(m[0]);
  }
  return found;
}

for (const target of TARGETS) {
  for (const file of walk(join(root, target))) {
    const ext = extname(file);
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((raw, i) => {
      const n = i + 1;
      const t = raw.trim();
      if (!t) return;
      if (isCommentLine(t)) return;
      // Trailing comment on the line: that part is ignored.
      const code = raw.replace(/\/\*.*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/, '$1');

      if (ext === '.css' && HEX.test(code)) fail(file, n, 'color hex crudo', raw);
      if (COLOR_FN.test(code)) fail(file, n, 'rgba()/hsla() crudo', raw);

      if (t.startsWith('@media')) {
        const nums = [...t.matchAll(PX)].map((m) => m[1]);
        const bad = nums.filter((v) => !ALLOWED_BREAKPOINTS.has(v));
        if (bad.length) fail(file, n, `@media con valor fuera de 640/900/1024/1180: ${bad.join(', ')}`, raw);
        const prev = lines[i - 1] ?? '';
        if (nums.length && !raw.includes(BP_COMMENT) && !prev.includes(BP_COMMENT)) {
          fail(file, n, `@media sin comentario "/* ${BP_COMMENT} */"`, raw);
        }
        return;
      }

      const px = badPx(code);
      if (px.length) fail(file, n, `px crudo (${px.join(', ')})`, raw);

      if (code.includes('style={{')) {
        const after = code.slice(code.indexOf('style={{') + 8);
        const body = after.split('}}')[0];
        const stripped = body.replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""');
        const hasPlainKey = /(^|[,{\s])[A-Za-z_$][\w$]*\s*:/.test(stripped);
        if (!body.includes("'--") || hasPlainKey) {
          fail(file, n, 'style={{…}} solo puede fijar propiedades personalizadas (\'--…\')', raw);
        }
      }
    });
  }
}

// base.css: no raw colors; px only 1px/2px (better still: tokens).
const basePath = join(root, 'src/styles/base.css');
if (existsSync(basePath)) {
  readFileSync(basePath, 'utf8').split('\n').forEach((raw, i) => {
    const t = raw.trim();
    if (isCommentLine(t)) return;
    if (HEX.test(t)) fail(basePath, i + 1, 'color hex en base.css', raw);
    if (COLOR_FN.test(t)) fail(basePath, i + 1, 'rgba()/hsla() en base.css', raw);
    for (const m of t.matchAll(PX)) {
      if (!['0', '1', '2'].includes(m[1])) fail(basePath, i + 1, `px en base.css (${m[0]})`, raw);
    }
  });
}

if (failures.length) {
  console.error(`check:tokens — ${failures.length} problema(s):\n`);
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('check:tokens OK — sin valores crudos en src/components, src/app ni base.css');
