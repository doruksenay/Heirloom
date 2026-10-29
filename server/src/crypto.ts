// Small Web Crypto helpers. They run the same in Cloudflare Workers and in Node 20+ (vitest).

const enc = new TextEncoder();

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** SHA-256 of a string, as hex. Used for device secrets, which are long random strings already. */
export async function sha256(text: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

/**
 * HMAC-SHA-256 with the server's PEPPER secret, as hex. Used for PINs and hashed IP addresses: a PIN has only a
 * million values, so a plain hash would be easy to reverse from a leaked database; without the pepper (which lives
 * only in the Worker's secrets, never in D1) it is not.
 */
export async function hmac(key: string, text: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(text)));
}

/** Compares two strings in time that does not depend on where they differ. */
export function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** No 0/O, 1/I/L: codes are read aloud and typed on phones. 32 symbols = 5 bits each. */
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function randomString(len: number, alphabet = CODE_ALPHABET): string {
  const out: string[] = [];
  // rejection sampling keeps every symbol equally likely
  const limit = 256 - (256 % alphabet.length);
  while (out.length < len) {
    const bytes = crypto.getRandomValues(new Uint8Array(len * 2));
    for (const b of bytes) {
      if (b < limit && out.length < len) out.push(alphabet[b % alphabet.length]);
    }
  }
  return out.join('');
}

/** A family code like HLM-7K2Q-9XPA (8 random symbols, about 39 bits). */
export const newFamilyCode = () => `HLM-${randomString(4)}-${randomString(4)}`;

/** A 6-digit PIN. */
export const newPin = () => randomString(6, '0123456789');

/** Accepts "hlm 7k2q 9xpa", "HLM7K2Q9XPA" and the like; null if it cannot be a family code. */
export function normalizeFamilyCode(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 40) return null;
  const s = raw.toUpperCase().replace(/[^0-9A-Z]/g, '');
  const body = s.startsWith('HLM') ? s.slice(3) : s;
  if (body.length !== 8 || [...body].some((ch) => !CODE_ALPHABET.includes(ch))) return null;
  return `HLM-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** Gift codes: 4–24 letters, digits and dashes, case-insensitive. */
export function normalizeGiftCode(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 40) return null;
  const s = raw.trim().toUpperCase().replace(/\s+/g, '-');
  return /^[0-9A-Z][0-9A-Z-]{2,22}[0-9A-Z]$/.test(s) ? s : null;
}
