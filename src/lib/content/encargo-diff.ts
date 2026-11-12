// Leaf-path diff between two override documents (audit metadata: paths only, never values).
type Obj = Record<string, unknown>;

function flatten(v: unknown, prefix: string, out: Map<string, string>) {
  if (Array.isArray(v)) {
    v.forEach((el, i) => flatten(el, prefix ? `${prefix}.${i}` : String(i), out));
  } else if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Obj)) flatten(val, prefix ? `${prefix}.${k}` : k, out);
  } else if (v !== undefined && v !== null) {
    out.set(prefix, JSON.stringify(v));
  }
}

/** Leaf paths whose value changed (added, removed or different). Values themselves are never returned. */
export function diffPaths(before: unknown, after: unknown): string[] {
  const a = new Map<string, string>();
  const b = new Map<string, string>();
  flatten(before, '', a);
  flatten(after, '', b);
  const keys = new Set([...a.keys(), ...b.keys()]);
  return [...keys].filter((k) => a.get(k) !== b.get(k)).sort();
}
