import { z } from 'zod';

/** Builds a character class from code point ranges (kept numeric so no invisible characters live in the source). */
function charClass(...ranges: [number, number][]): RegExp {
  const hex = (n: number) => '\\u' + n.toString(16).padStart(4, '0');
  return new RegExp('[' + ranges.map(([a, b]) => hex(a) + '-' + hex(b)).join('') + ']');
}

// C0 controls (newline is stripped before the test when multiline), DEL + C1 controls, line/paragraph separators.
const CONTROL = charClass([0x00, 0x1f], [0x7f, 0x9f], [0x2028, 0x2029]);
// Bidi embeddings/overrides U+202A-202E and isolates U+2066-2069: used to spoof how text reads.
const BIDI = charClass([0x202a, 0x202e], [0x2066, 0x2069], [0x200e, 0x200f], [0x061c, 0x061c]);
// Zero-width U+200B-200D, word joiner U+2060 and BOM U+FEFF.
// Also soft hyphen U+00AD and Mongolian vowel separator U+180E (invisible).
const ZERO_WIDTH = charClass([0x200b, 0x200d], [0x2060, 0x2060], [0xfeff, 0xfeff], [0x00ad, 0x00ad], [0x180e, 0x180e]);
// Markup and script-ish characters. Content is always rendered as text, this is defense in depth.
const MARKUP = /[<>`]/;
const SCRIPT_SCHEME = /(?:java|vb)script\s*:/i;

export type PlainTextOptions = { multiline?: boolean };

/** NFC-normalizes, trims and collapses runs of spaces. Pure; does not validate. */
export function normalizePlainText(value: string, multiline = false): string {
  let v = value.normalize('NFC');
  if (multiline) v = v.replace(/\r\n?/g, '\n');
  v = v.replace(/[ ]{2,}/g, ' ');
  if (multiline) v = v.replace(/ *\n */g, '\n');
  return v.trim();
}

/** Why a (normalized) string is not plain text, or null when it is fine. */
export function plainTextProblem(value: string, multiline = false): string | null {
  const probe = multiline ? value.replace(/\n/g, '') : value;
  if (CONTROL.test(probe)) return 'control';
  if (BIDI.test(value)) return 'bidi';
  if (ZERO_WIDTH.test(value)) return 'zero_width';
  // Also check the compatibility form, so fullwidth look-alikes (U+FF1C, U+FE64, fullwidth letters) are caught.
  const folded = value.normalize('NFKC');
  if (MARKUP.test(value) || MARKUP.test(folded)) return 'markup';
  if (SCRIPT_SCHEME.test(value) || SCRIPT_SCHEME.test(folded)) return 'script_scheme';
  if (multiline && /\n{3,}/.test(value)) return 'newlines';
  return null;
}

/**
 * Plain text for editable content: NFC + trim + collapsed spaces, then rejects control characters
 * (newline only when `multiline`, max 2 in a row), bidi overrides/isolates, zero-width characters,
 * `<`, `>`, backticks and script URL schemes. Length is measured after normalization.
 */
export function plainText(min: number, max: number, opts: PlainTextOptions = {}) {
  const multiline = opts.multiline ?? false;
  return z
    .string()
    .max(max * 4 + 50) // cheap guard before normalizing huge inputs
    .transform((v) => normalizePlainText(v, multiline))
    .pipe(
      z
        .string()
        .min(min)
        .max(max)
        .refine((v) => plainTextProblem(v, multiline) === null, { message: 'plain_text' }),
    );
}
