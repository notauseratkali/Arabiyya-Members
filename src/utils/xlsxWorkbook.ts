import ExcelJS from 'exceljs';

export async function buildXlsxBuffer(sheets: { name: string; rows: Record<string, any>[] }[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet((sheet.name || 'Sheet').slice(0, 31) || 'Sheet');
    const rows = sheet.rows;
    if (rows.length === 0) {
      worksheet.addRow(['No rows']);
      continue;
    }
    const headers = Object.keys(rows[0]);
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: Math.min(42, Math.max(14, header.length + 2))
    }));
    for (const row of rows) worksheet.addRow(row);
    worksheet.getRow(1).font = { bold: true };
  }
  const buffer = await workbook.xlsx.writeBuffer();
  if (buffer instanceof ArrayBuffer) return buffer;
  const bytes = Uint8Array.from(buffer as Buffer);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
