// Pure functions (no 'server-only') so they can be tested and used from scripts.

/** bcrypt cost factor for admin passwords. */
export const BCRYPT_COST = 12;

/** Minimum admin password length (enforced by `npm run admin:create`). */
export const MIN_PASSWORD_LENGTH = 12;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Parses a comma-separated ADMIN_EMAILS value: trims, lowercases and drops empties. */
export function parseAdminEmails(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(',')
        .map(normalizeEmail)
        .filter((e) => e.length > 0),
    ),
  );
}

export function isEmailAllowed(email: string, raw: string | undefined | null): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length > 0 && parseAdminEmails(raw).includes(normalized);
}
