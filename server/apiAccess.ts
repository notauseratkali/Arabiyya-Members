export function normalizeApiPath(path: string): string {
  const noQuery = path.split('?')[0];
  if (noQuery.length > 1 && noQuery.endsWith('/')) return noQuery.slice(0, -1);
  return noQuery;
}

export function isPublicApi(method: string, path: string): boolean {
  const m = method.toUpperCase();
  const p = normalizeApiPath(path);

  if (p === '/api/health' && m === 'GET') return true;
  if (p === '/api/auth/login' && m === 'POST') return true;
  if (p === '/api/auth/forgot-password/otp' && m === 'POST') return true;
  if (p === '/api/auth/forgot-password/reset' && m === 'POST') return true;
  if (p === '/api/auth/setup-first-time' && m === 'POST') return true;
  if (p === '/api/signup/verify-dob' && m === 'POST') return true;
  if (p === '/api/signup/member' && m === 'POST') return true;
  if (p === '/api/signup/leader' && m === 'POST') return true;
  if (p === '/api/signup/check-availability' && m === 'POST') return true;
  if (p === '/api/track/otp' && m === 'POST') return true;
  if (p === '/api/track/verify' && m === 'POST') return true;
  if (p === '/api/telegram/check-start' && m === 'POST') return true;
  if (p === '/api/policies' && m === 'GET') return true;
  if (p === '/api/settings' && m === 'GET') return true;
  if (p === '/api/logo' && m === 'GET') return true;
  if (p === '/api/sso/authenticate' && m === 'POST') return true;
  if (m === 'GET' && p.startsWith('/api/verify-invite/')) return true;
  return false;
}

export function requiresSecretary(method: string, path: string): boolean {
  const m = method.toUpperCase();
  const p = normalizeApiPath(path);

  if (p.startsWith('/api/admin')) return true;
  if (p === '/api/invite' && m === 'POST') return true;
  if (p === '/api/telegram/test-otp') return true;

  if (p.startsWith('/api/events') && m !== 'GET') {
    if (m === 'POST' && p.endsWith('/signup')) return false;
    return true;
  }

  if (p.startsWith('/api/announcements') && m !== 'GET') {
    if (p === '/api/announcements/mark-read' && m === 'POST') return false;
    return true;
  }

  if (p === '/api/attendance/mark' || p === '/api/attendance/status') return true;
  if (p.startsWith('/api/meeting-minutes') && m !== 'GET') return true;
  if (p.startsWith('/api/policies') && m !== 'GET') return true;
  if (p.startsWith('/api/members/') && m === 'DELETE') return true;
  if (p.startsWith('/api/logbook') && p.endsWith('/review')) return true;

  return false;
}

/** Non-secretaries may only act on their own member id. */
export function canActAsMember(isSecretary: boolean, sessionId: string, memberId: unknown): boolean {
  if (isSecretary) return true;
  return typeof memberId === 'string' && memberId.length > 0 && memberId === sessionId;
}
