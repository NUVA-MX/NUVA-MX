import { adminEncargo as copy } from '@/content/admin-encargo';
import { fillTemplate } from '@/lib/format';

type Issue = { code: string; path: PropertyKey[]; message: string; maximum?: unknown; minimum?: unknown };

/** One Spanish message per failing field (first issue wins), keyed by the form field name. */
export function issuesToErrors(issues: readonly Issue[]): Record<string, string> {
  const e = copy.errors;
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || 'form';
    if (out[key]) continue;
    let msg: string = e.generic;
    if (issue.message === 'image_url') msg = e.image;
    else if (issue.message === 'alt_required') msg = e.altRequired;
    else if (issue.message === 'template') msg = /teamQuote/.test(key) ? e.templateNone : e.template;
    else if (issue.message === 'date') msg = e.date;
    else if (issue.message === 'date_order') msg = e.dateOrder;
    else if (issue.message === 'marquee_text_required') msg = e.marqueeText;
    else if (issue.message === 'plain_text') msg = e.text;
    else if (issue.code === 'too_big') msg = fillTemplate(e.tooLong, { max: Number(issue.maximum) });
    else if (issue.code === 'too_small') msg = /\.alt$|^imageAlt$/.test(key) ? e.altRequired : e.required;
    else if (issue.code === 'invalid_value' && key === 'technique') msg = e.technique;
    out[key] = msg;
  }
  return out;
}
