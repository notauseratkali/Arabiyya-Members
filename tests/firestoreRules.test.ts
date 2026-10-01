import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

function block(collection: string): string {
  const match = rules.match(new RegExp(`match /${collection}/\\{[^}]+\\} \\{([\\s\\S]*?)\\n    \\}`));
  assert.ok(match, `missing rules block for ${collection}`);
  return match[1];
}

test('sensitive collections are not world-readable or writable', () => {
  for (const name of ['otps', 'member_applications', 'leader_applications', 'settings', 'members', 'invitations']) {
    const body = block(name);
    assert.equal(body.includes('if true'), false, name);
    assert.match(body, /allow read, write: if false/);
  }
});

test('published policy is public read and client writes are denied', () => {
  const body = block('policies');
  assert.match(body, /allow read: if true/);
  assert.match(body, /allow write: if false/);
});
