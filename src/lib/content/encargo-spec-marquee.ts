// Admin spec of the marquee (promo band) section: fields plus the status note.
import { adminEncargo as copy } from '@/content/admin-encargo';
import { fillTemplate } from '@/lib/format';
import { marqueeAt, type EncargoDefaults, type PromoWindow } from './encargo-merge';
import type { EncargoOverrides } from './encargo-schema';
import type { SectionSpec } from './encargo-spec-types';
import { TEXT_LIMITS } from './limits';
import { mxDayEndUtc, mxDayStartUtc } from './mx-date';

export function marqueeSpec(
  d: EncargoDefaults,
  m: EncargoOverrides['marquee'],
  now: Date,
): Pick<SectionSpec, 'fields' | 'notes'> {
  const s = copy.sections;
  const L = TEXT_LIMITS;
  const window: PromoWindow | null =
    m?.enabled && m.text
      ? { text: m.text, startsAt: m.startsOn ? mxDayStartUtc(m.startsOn) : null, endsAt: m.endsOn ? mxDayEndUtc(m.endsOn) : null }
      : null;
  const state = marqueeAt(d.marquee, window, now);
  const status = !window
    ? s.marquee.status.off
    : state.isPromo
      ? s.marquee.status.active
      : state.nextBoundary
        ? s.marquee.status.scheduled
        : s.marquee.status.ended;
  const f = s.marquee.fields;
  return {
    fields: [
      { kind: 'checkbox', name: 'enabled', label: f.enabled, checked: m?.enabled === true, overridden: m?.enabled !== undefined, restore: 'enabled' },
      { kind: 'text', name: 'text', label: f.text, value: m?.text ?? '', defaultValue: null, overridden: m?.text !== undefined, restore: 'text', maxLength: L.marqueeText },
      { kind: 'date', name: 'startsOn', label: f.startsOn, value: m?.startsOn ?? '', defaultValue: null, overridden: m?.startsOn !== undefined, restore: 'startsOn', maxLength: 10 },
      { kind: 'date', name: 'endsOn', label: f.endsOn, value: m?.endsOn ?? '', defaultValue: null, overridden: m?.endsOn !== undefined, restore: 'endsOn', maxLength: 10 },
    ],
    notes: [status, fillTemplate(s.marquee.defaultText, { text: d.marquee }), s.marquee.hint],
  };
}
