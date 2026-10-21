import { describe, expect, it } from 'vitest';
import { buildMailtoLink, buildWhatsAppLink } from '../whatsapp';

describe('buildWhatsAppLink', () => {
  it('quita todo lo que no es dígito', () => {
    expect(buildWhatsAppLink({ phone: '+52 (55) 1234-5678', message: 'Hola' })).toBe(
      'https://wa.me/525512345678?text=Hola',
    );
  });
  it('codifica el mensaje', () => {
    const url = buildWhatsAppLink({ phone: '5215512345678', message: 'Hola Nuva, "gorra" & más\n2 × $390' });
    expect(url).toBe(`https://wa.me/5215512345678?text=${encodeURIComponent('Hola Nuva, "gorra" & más\n2 × $390')}`);
    expect(decodeURIComponent(url.split('?text=')[1])).toBe('Hola Nuva, "gorra" & más\n2 × $390');
  });
  it('sin teléfono real no incluye TODO en la URL', () => {
    const url = buildWhatsAppLink({ phone: 'TODO(cliente)', message: 'Hola' });
    expect(url).toBe('https://wa.me/?text=Hola');
    expect(url).not.toContain('TODO');
  });
  it('sin mensaje no agrega text', () => {
    expect(buildWhatsAppLink({ phone: '123' })).toBe('https://wa.me/123');
  });
});

describe('buildMailtoLink', () => {
  it('acepta correos válidos', () => {
    expect(buildMailtoLink('hola@nuva.mx')).toBe('mailto:hola@nuva.mx');
  });
  it('rechaza marcadores', () => {
    expect(buildMailtoLink('TODO(cliente)')).toBeNull();
  });
});
