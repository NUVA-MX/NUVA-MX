import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

describe('(i) static checks', () => {
  it('no file under src/ uses raw HTML injection', () => {
    const needle = 'dangerously' + 'SetInnerHTML';
    const hits = walk(SRC).filter((f) => readFileSync(f, 'utf8').includes(needle));
    expect(hits).toEqual([]);
  });

  it('the actions file is a server-actions module that only exports async functions', () => {
    const src = readFileSync(join(SRC, 'app/admin/encargo-actions.ts'), 'utf8');
    expect(src.startsWith("'use server'")).toBe(true);
    const exports = [...src.matchAll(/^export\s+(.*)$/gm)].map((m) => m[1]!);
    expect(exports.length).toBeGreaterThan(0);
    for (const e of exports) expect(e.startsWith('async function ') || e.startsWith('type ')).toBe(true);
  });

  it('every action starts with requireAdmin() as its first statement', () => {
    const src = readFileSync(join(SRC, 'app/admin/encargo-actions.ts'), 'utf8');
    const bodies = src.split(/^export async function /m).slice(1);
    expect(bodies.length).toBe(7);
    for (const body of bodies) {
      const firstStatement = body.slice(body.indexOf('{') + 1).trim().split('\n')[0]!.trim();
      expect(firstStatement).toBe('const admin = await requireAdmin();');
      expect(body).toMatch(/enforceRateLimit|gateWrite\(admin\)/);
    }
  });

  it('Object.fromEntries and formData.entries are never used to read the content forms', () => {
    for (const f of ['lib/content/encargo-form.ts', 'app/admin/encargo-actions.ts']) {
      const code = readFileSync(join(SRC, f), 'utf8').replace(/\/\/.*$/gm, '');
      expect(code).not.toMatch(/Object\.fromEntries|formData\.entries|formData\.keys|formData\.values/);
    }
  });
});
