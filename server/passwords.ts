import crypto from 'crypto';

const PREFIX = 'scrypt';
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (err, derived) => {
      if (err) reject(err);
      else resolve(derived as Buffer);
    });
  });
}

export type PasswordCheck = 'hashed' | 'legacy' | 'phone' | 'miss';

export function isHashedPassword(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(`${PREFIX}$`) && value.split('$').length === 3;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(plain, salt);
  return `${PREFIX}$${salt}$${derived.toString('hex')}`;
}

/**
 * The Add Member form sends `password`. Older clients send `passwordHash`.
 * Prefer the password the secretary just typed.
 */
export function memberPasswordInput(data: { password?: unknown; passwordHash?: unknown }): string {
  if (typeof data.password === 'string' && data.password.length > 0) return data.password;
  if (typeof data.passwordHash === 'string' && data.passwordHash.length > 0) return data.passwordHash;
  return '';
}

/** Hash a new password. Leave an existing scrypt value unchanged so imports are not double-hashed. */
export async function ensurePasswordHash(value: string): Promise<string> {
  if (isHashedPassword(value)) return value;
  return hashPassword(value);
}

function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('960') && digits.length >= 10) return digits.slice(3);
  return digits;
}

/**
 * Check a stored passwordHash.
 * - hashed: scrypt match
 * - legacy: exact match against a pre-migration plaintext value (caller should re-hash)
 * - phone: no password stored, and the typed value matches the member phone without country code
 * - miss: no match
 */
export async function checkPassword(
  stored: string | null | undefined,
  plain: string,
  phoneWhenUnset?: string | null
): Promise<PasswordCheck> {
  const candidate = typeof plain === 'string' ? plain.trim() : '';
  const storedValue = typeof stored === 'string' ? stored : '';

  if (candidate === '') return 'miss';

  if (isHashedPassword(storedValue)) {
    const [, salt, hashHex] = storedValue.split('$');
    if (!salt || !hashHex || hashHex.length % 2 !== 0) return 'miss';
    try {
      const derived = await scryptAsync(candidate, salt);
      const expected = Buffer.from(hashHex, 'hex');
      if (expected.length !== derived.length) return 'miss';
      if (crypto.timingSafeEqual(expected, derived)) return 'hashed';
    } catch {
      return 'miss';
    }
    return 'miss';
  }

  if (storedValue && candidate === storedValue) return 'legacy';

  if (!storedValue && phoneWhenUnset) {
    const typed = phoneDigits(candidate);
    const onFile = phoneDigits(phoneWhenUnset);
    if (typed !== '' && typed === onFile) return 'phone';
  }

  return 'miss';
}
