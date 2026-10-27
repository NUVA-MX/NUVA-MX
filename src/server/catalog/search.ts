import 'server-only';

/** Lowercase, accent-free, single-spaced text: the form stored in search_text and used for the query. */
export function searchKey(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escapes LIKE wildcards so user text only matches itself (the pattern is still a bound parameter). */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Up to 5 search words, each an escaped LIKE pattern. */
export function likePatterns(q: string): string[] {
  return searchKey(q)
    .split(' ')
    .filter(Boolean)
    .slice(0, 5)
    .map((w) => `%${escapeLike(w)}%`);
}
