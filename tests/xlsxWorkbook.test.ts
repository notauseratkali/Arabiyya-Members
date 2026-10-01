import test from 'node:test';
import assert from 'node:assert/strict';
import { buildXlsxBuffer } from '../src/utils/xlsxWorkbook.ts';

test('attendance workbook export writes a real xlsx zip', async () => {
  const buffer = await buildXlsxBuffer([
    { name: 'Event Attendance', rows: [{ 'Full Name': 'Amina', 'Attendance Status': 'Attended' }] },
    { name: 'Event Overview', rows: [] }
  ]);
  const bytes = Buffer.from(buffer);
  assert.equal(bytes.subarray(0, 2).toString(), 'PK');
  assert.ok(bytes.length > 100);
});
