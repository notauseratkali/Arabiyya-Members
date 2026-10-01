import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, checkPassword, isHashedPassword, ensurePasswordHash, memberPasswordInput } from '../server/passwords.ts';

test('scrypt hashes round-trip and reject a wrong password', async () => {
  const stored = await hashPassword('correct horse');
  assert.equal(isHashedPassword(stored), true);
  assert.equal(await checkPassword(stored, 'correct horse'), 'hashed');
  assert.equal(await checkPassword(stored, 'wrong horse'), 'miss');
  assert.equal(await checkPassword(stored + 'aa', 'correct horse'), 'miss');
});

test('legacy plaintext matches once and is flagged for upgrade', async () => {
  assert.equal(await checkPassword('admin123', 'admin123'), 'legacy');
  assert.equal(await checkPassword('admin123', 'admin124'), 'miss');
  assert.equal(isHashedPassword('admin123'), false);
});

test('phone fallback only applies when no password is stored', async () => {
  assert.equal(await checkPassword('', '7712345', '+960 7712345'), 'phone');
  assert.equal(await checkPassword('', '0000000', '+960 7712345'), 'miss');
  assert.equal(await checkPassword('scout123', '7712345', '+960 7712345'), 'miss');
});

test('member create accepts the password field the Add Member form sends', async () => {
  assert.equal(memberPasswordInput({ password: 'scout123' }), 'scout123');
  assert.equal(memberPasswordInput({ password: 'typed', passwordHash: 'old' }), 'typed');
  const stored = await ensurePasswordHash(memberPasswordInput({ password: 'scout123' }));
  assert.equal(isHashedPassword(stored), true);
  assert.equal(await checkPassword(stored, 'scout123'), 'hashed');
  assert.equal(await checkPassword(stored, '7712345', '+960 7712345'), 'miss');
});

test('ensurePasswordHash does not double-hash', async () => {
  const once = await hashPassword('scout123');
  const twice = await ensurePasswordHash(once);
  assert.equal(twice, once);
  const fresh = await ensurePasswordHash('scout123');
  assert.equal(isHashedPassword(fresh), true);
  assert.notEqual(fresh, 'scout123');
});
