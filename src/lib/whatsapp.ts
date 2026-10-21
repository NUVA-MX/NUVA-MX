/**
 * Builds a wa.me link. If the phone has no digits (e.g. "TODO(cliente)"),
 * returns https://wa.me/?text=… so the URL never contains "TODO".
 */
export function buildWhatsAppLink({ phone, message }: { phone: string; message?: string }): string {
  const digits = phone.replace(/\D/g, '');
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Returns a mailto link only if the email looks valid; otherwise null. */
export function buildMailtoLink(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
}
