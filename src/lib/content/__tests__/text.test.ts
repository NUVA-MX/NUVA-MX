import { describe, expect, it } from 'vitest';
import { plainText } from '../text';

const ch = (n: number) => String.fromCharCode(n);

describe('plainText', () => {
  const t = plainText(1, 20);
  it('trims, collapses spaces and NFC-normalizes', () => {
    expect(t.parse('  hola   mundo ')).toBe('hola mundo');
    expect(t.parse('cafe' + ch(0x301))).toBe('caf' + ch(0xe9));
  });
  it('accepts Spanish punctuation and quotes', () => {
    expect(t.parse('¿Qué tal? "sí"')).toBe('¿Qué tal? "sí"');
  });
  it.each([
    ['tab', 'a' + ch(9) + 'b'],
    ['NUL', 'a' + ch(0) + 'b'],
    ['ESC', 'a' + ch(0x1b)],
    ['DEL', 'a' + ch(0x7f)],
    ['C1', 'a' + ch(0x85)],
    ['LS', 'a' + ch(0x2028) + 'b'],
    ['newline in single line', 'a\nb'],
    ['bidi RLO', 'a' + ch(0x202e) + 'b'],
    ['bidi LRE', 'a' + ch(0x202a) + 'b'],
    ['bidi isolate', 'a' + ch(0x2066) + 'b'],
    ['bidi PDI', 'a' + ch(0x2069) + 'b'],
    ['ZWSP', 'a' + ch(0x200b) + 'b'],
    ['ZWJ', 'a' + ch(0x200d) + 'b'],
    ['BOM', 'a' + ch(0xfeff) + 'b'],
    ['LRM', 'a' + ch(0x200e) + 'b'],
    ['RLM', 'a' + ch(0x200f) + 'b'],
    ['ALM', 'a' + ch(0x061c) + 'b'],
    ['soft hyphen', 'a' + ch(0xad) + 'b'],
    ['mongolian vowel separator', 'a' + ch(0x180e) + 'b'],
    ['fullwidth lt', 'a' + ch(0xff1c) + 'b'],
    ['small lt', 'a' + ch(0xfe64) + 'b'],
    ['fullwidth javascript', 'ＪＡＶＡＳＣＲＩＰＴ:x'],
    ['lt', 'a<b'],
    ['gt', 'a>b'],
    ['backtick', 'a`b'],
    ['script tag', '<script>alert(1)</script>'],
    ['attr breakout', '"><img src=x onerror=alert(1)>'],
    ['javascript scheme', 'JavaScript :alert(1)'],
    ['too long', 'x'.repeat(21)],
    ['empty after trim', '   '],
  ])('rejects %s', (_name, value) => {
    expect(t.safeParse(value).success).toBe(false);
  });
  it('multiline allows newlines but at most 2 in a row', () => {
    const m = plainText(1, 50, { multiline: true });
    expect(m.parse('a\nb')).toBe('a\nb');
    expect(m.parse('a\r\nb')).toBe('a\nb');
    expect(m.parse('a\n\nb')).toBe('a\n\nb');
    expect(m.safeParse('a\n\n\nb').success).toBe(false);
    expect(m.safeParse('a' + ch(9) + 'b').success).toBe(false);
  });
  it('measures length after normalization', () => {
    expect(plainText(1, 3).safeParse('  abc  ').success).toBe(true);
  });
});
