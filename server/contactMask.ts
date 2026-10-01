/** Hide a phone number or Telegram handle in unauthenticated OTP responses. */
export function maskContact(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const handle = trimmed.replace(/^@/, '');
  const digits = trimmed.replace(/\D/g, '');
  const looksLikeHandle = trimmed.startsWith('@') || (digits.length < 4 && /[a-z]/i.test(handle));

  if (looksLikeHandle) {
    if (handle.length <= 2) return '@**';
    return `@${handle.slice(0, 1)}***${handle.slice(-1)}`;
  }

  if (digits.length >= 4) return `***${digits.slice(-2)}`;
  return '***';
}
