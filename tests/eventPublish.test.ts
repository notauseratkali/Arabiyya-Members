import test from 'node:test';
import assert from 'node:assert/strict';
import { memberCanSeeEvent, publishTimeReached, PUBLISH_TIME_SKEW_MS } from '../server/eventPublish.ts';

const now = Date.parse('2026-06-01T12:00:00.000Z');

test('publish time allows six hours of clock skew and not a full day', () => {
  const inTwoHours = new Date(now + 2 * 60 * 60 * 1000).toISOString();
  const inTwentyHours = new Date(now + 20 * 60 * 60 * 1000).toISOString();
  const justOutsideSkew = new Date(now + PUBLISH_TIME_SKEW_MS + 60 * 1000).toISOString();
  assert.equal(publishTimeReached(inTwoHours, now), true);
  assert.equal(publishTimeReached(inTwentyHours, now), false);
  assert.equal(publishTimeReached(justOutsideSkew, now), false);
  assert.equal(publishTimeReached('not-a-date', now), false);
});

test('members do not see drafts or events whose publish time is still ahead', () => {
  assert.equal(memberCanSeeEvent({ status: 'Draft', isPublished: true }, now), false);
  assert.equal(memberCanSeeEvent({
    publishDateTime: new Date(now + 20 * 60 * 60 * 1000).toISOString(),
    fromDateTime: new Date(now - 60 * 60 * 1000).toISOString()
  }, now), false);
  assert.equal(memberCanSeeEvent({
    fromDateTime: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString()
  }, now), true);
  assert.equal(memberCanSeeEvent({ isPublished: true, publishDateTime: new Date(now + 48 * 60 * 60 * 1000).toISOString() }, now), true);
});
