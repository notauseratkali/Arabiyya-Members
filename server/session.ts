import crypto from 'crypto';

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: string;
  isSecretary: boolean;
  exp: number;
}

let memorySecret: string | null = null;

export function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim()) {
    return process.env.SESSION_SECRET.trim();
  }
  if (!memorySecret) {
    memorySecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Session] SESSION_SECRET is not set. Sign-in tokens will reset when the server restarts.');
  }
  return memorySecret;
}

function signBody(body: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(body).digest('base64url');
}

export function signSession(user: Omit<SessionUser, 'exp'> & { exp?: number }): string {
  const payload: SessionUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isSecretary: user.isSecretary,
    exp: user.exp ?? Date.now() + 12 * 60 * 60 * 1000
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${signBody(body)}`;
}

export function verifySession(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = signBody(body);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionUser;
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    if (!payload.id && !payload.username) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionFromAuthHeader(header: string | undefined): SessionUser | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return verifySession(match[1].trim());
}
