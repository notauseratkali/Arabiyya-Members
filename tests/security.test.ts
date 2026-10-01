import test from 'node:test';
import assert from 'node:assert/strict';
import { signSession, verifySession, sessionFromAuthHeader } from '../server/session.ts';
import { isPublicApi, requiresSecretary, canActAsMember } from '../server/apiAccess.ts';
import { sanitizeHtml } from '../src/utils/sanitizeHtml.ts';
import { countPendingRequests } from '../src/utils/requestCounts.ts';

test('session tokens round-trip and reject tampering', () => {
  process.env.SESSION_SECRET = 'test-secret';
  const token = signSession({
    id: 'member-1',
    username: 'rover',
    email: 'rover@example.com',
    role: 'Rover',
    isSecretary: false
  });
  const session = verifySession(token);
  assert.equal(session?.id, 'member-1');
  assert.equal(session?.isSecretary, false);
  assert.equal(verifySession(token + 'x'), null);
  assert.equal(sessionFromAuthHeader(`Bearer ${token}`)?.username, 'rover');
  assert.equal(sessionFromAuthHeader('Bearer not-a-token'), null);
});

test('public routes stay open and admin routes require a secretary', () => {
  assert.equal(isPublicApi('POST', '/api/auth/login'), true);
  assert.equal(isPublicApi('POST', '/api/signup/member'), true);
  assert.equal(isPublicApi('GET', '/api/policies'), true);
  assert.equal(isPublicApi('GET', '/api/members'), false);
  assert.equal(requiresSecretary('GET', '/api/admin/settings'), true);
  assert.equal(requiresSecretary('DELETE', '/api/members/abc'), true);
  assert.equal(requiresSecretary('POST', '/api/events/evt-1/signup'), false);
  assert.equal(requiresSecretary('POST', '/api/events'), true);
  assert.equal(requiresSecretary('POST', '/api/announcements/mark-read'), false);
  assert.equal(requiresSecretary('PUT', '/api/profile/update'), false);
  assert.equal(requiresSecretary('DELETE', '/api/logbook/log-1'), false);
  assert.equal(requiresSecretary('POST', '/api/logbook/log-1/review'), true);
  assert.equal(canActAsMember(false, 'mem-1', 'mem-1'), true);
  assert.equal(canActAsMember(false, 'mem-1', 'mem-2'), false);
  assert.equal(canActAsMember(true, 'admin-001', 'mem-2'), true);
});

test('html sanitizer removes scripts and event handlers', () => {
  const clean = sanitizeHtml('<p onclick="alert(1)">Hello</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>');
  assert.equal(clean.includes('script'), false);
  assert.equal(clean.includes('onclick'), false);
  assert.equal(clean.includes('javascript:'), false);
  assert.equal(clean.includes('<p>Hello</p>'), true);
});

test('pending request count uses the admin payload field names', () => {
  const count = countPendingRequests({
    memberApplications: [{ status: 'Pending Review' }, { status: 'Active' }],
    profileUpdateRequests: [{ status: 'Pending' }],
    attendanceExcuses: [{ excuseStatus: 'Pending Review' }, { excuseStatus: 'Approved' }]
  });
  assert.equal(count, 3);
  assert.equal(countPendingRequests({
    memberApplications: [{ status: 'Pending Verification' }]
  }), 1);
  assert.equal(countPendingRequests({
    memberApplications: [{ status: 'Investiture' }, { status: 'Active' }]
  }), 0);
  assert.equal(countPendingRequests({
    joinRequests: [{ status: 'Pending Review' }],
    profileRequests: [{ status: 'Pending' }],
    absenceExcuses: [{ excuseStatus: 'Pending Review' }]
  } as any), 0);
});
