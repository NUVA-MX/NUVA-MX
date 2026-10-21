import { describe, expect, it } from 'vitest';
import { encargo } from '@/content/encargo';
import { buildWhatsAppLink } from '@/lib/whatsapp';

describe('encargo WhatsApp messages', () => {
  const messages = Object.entries(encargo.whatsapp.messages);

  it.each(messages)('%s asks for the facts the workshop needs and survives URL encoding', (_key, message) => {
    expect(message).toMatch(/^Hola Nuva/);
    expect(message).toContain('Cantidad: __');
    expect(message).toContain('Fecha: __');
    const link = buildWhatsAppLink({ phone: '52 55 1234 5678', message });
    expect(decodeURIComponent(link.split('?text=')[1])).toBe(message);
  });

  it('the closing panel and the team quote use the general and team messages', () => {
    expect(encargo.proceso.cta.message).toBe(encargo.whatsapp.messages.general);
    expect(encargo.equipos.ctaMessage).toBe(encargo.whatsapp.messages.equipo);
  });
});
