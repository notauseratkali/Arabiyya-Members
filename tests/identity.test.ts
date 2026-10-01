import test from 'node:test';
import assert from 'node:assert/strict';
import { accountIsSecretary, identityChangeError, signupUsernameError, visibleInMemberDirectory } from '../server/identity.ts';
import { maskContact } from '../server/contactMask.ts';

test('copying a council email or reserved username does not grant secretary', () => {
  assert.equal(accountIsSecretary({
    role: 'Rover',
    id: 'mem-1',
    username: 'scout',
    privilegedUsernames: ['admin', 'nazihnafiz']
  }), false);
  assert.equal(accountIsSecretary({
    role: 'Rover',
    id: 'mem-1',
    username: 'admin',
    privilegedUsernames: ['admin', 'nazihnafiz']
  }), false);
  assert.equal(accountIsSecretary({
    role: 'Secretary',
    id: 'admin-001',
    username: 'admin'
  }), true);
  assert.equal(accountIsSecretary({
    role: 'Rover',
    id: 'mem-9',
    username: 'nazihnafiz',
    privilegedUsernames: ['nazihnafiz']
  }), true);
});

test('members cannot take a reserved or assigned username or council email', () => {
  const base = {
    actorIsSecretary: false,
    memberId: 'mem-1',
    currentUsername: 'scout',
    currentEmail: 'scout@example.com',
    otherUsernames: ['rover2'],
    otherEmails: ['taken@example.com'],
    privilegedUsernames: ['nazihnafiz']
  };
  assert.equal(identityChangeError({ ...base, nextUsername: 'admin' }), 'That username is reserved.');
  assert.equal(identityChangeError({ ...base, nextUsername: 'nazihnafiz' }), 'That username is reserved.');
  assert.equal(identityChangeError({ ...base, nextUsername: 'rover2' }), 'That username is already in use.');
  assert.equal(identityChangeError({ ...base, nextEmail: 'it@arabiyyascouts.org' }), 'That email address is reserved.');
  assert.equal(identityChangeError({ ...base, nextEmail: 'taken@example.com' }), 'That email address is already in use.');
  assert.equal(identityChangeError({ ...base, nextUsername: 'scout', nextEmail: 'scout@example.com' }), null);
  assert.equal(identityChangeError({ ...base, nextUsername: 'newscout' }), null);
});

test('signup cannot claim the built-in secretary username', () => {
  assert.equal(signupUsernameError('admin', ['nazihnafiz']), 'That username is reserved.');
  assert.equal(signupUsernameError('nazihnafiz', ['nazihnafiz']), 'That username is reserved.');
  assert.equal(signupUsernameError('newrover', ['nazihnafiz']), null);
});

test('the member directory hides applications from non-secretaries', () => {
  assert.equal(visibleInMemberDirectory('Pending Verification', false), false);
  assert.equal(visibleInMemberDirectory('Suspended', false), false);
  assert.equal(visibleInMemberDirectory('Investiture', false), true);
  assert.equal(visibleInMemberDirectory('Pending Verification', true), true);
});

test('public OTP responses mask phone numbers and handles', () => {
  assert.equal(maskContact('+960 7712345'), '***45');
  assert.equal(maskContact('@nazihnafiz'), '@n***z');
  assert.equal(maskContact(''), undefined);
});
