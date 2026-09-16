import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clipboard, 
  RefreshCw,
  Check
} from 'lucide-react';

interface BulkMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkMemberModal: React.FC<BulkMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [pasteData, setPasteData] = useState('');
  const [syncExisting, setSyncExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    createdCount: number;
    updatedCount: number;
    totalCount: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  const downloadTemplate = (format: 'csv' | 'tsv') => {
    const delim = format === 'tsv' ? '\t' : ',';
    const headers = [
      'Full Name',
      'Common Name',
      'ID Card Number',
      'Date of Birth',
      'Age',
      'Gender',
      'Permanent Address',
      'Current Address',
      'Emergency Contact Name',
      'Emergency Relationship',
      'Emergency Contact Number',
      'Email Address',
      'Mobile Number',
      'Phone Number',
      'Telegram Number',
      'Telegram Tag',
      'Whatsapp Number',
      'Instagram Tag',
      'Award Goal',
      'Current Level',
      'Is New To Scouting',
      'Last Scout Group',
      'Investiture Date',
      'Resignation Date'
    ];

    const row1 = [
      'Ahmed Hassan',
      'Ahmed',
      'A100001',
      '2004-03-15',
      '22',
      'Male',
      'M. Rose, Henveiru, Male',
      'H. Oceanic Flat, Hulhumale Phase 1',
      'Hassan Ibrahim',
      'Parent',
      '+960 7712345',
      'ahmed@arabiyyarovers.net',
      '+960 7901122',
      '+960 7901122',
      '+960 7901122',
      '@ahmed.scout',
      '+960 7901122',
      '@ahmed.scout',
      'Baden-Powell Award',
      'Square',
      'No',
      '11th Male Scout Group',
      '2023-01-15',
      ''
    ];

    const row2 = [
      'Mariyam Aminath',
      'Mariyam',
      'A100002',
      '2006-08-22',
      '20',
      'Female',
      'G. Sunshine, Galolhu, Male',
      'G. Sunshine, Galolhu, Male',
      'Aminath Ali',
      'Parent',
      '+960 7723456',
      'mariyam@arabiyyarovers.net',
      '+960 7912233',
      '+960 3324567',
      '+960 7912233',
      '@mariyam.adventures',
      '+960 7912233',
      '@mariyam.adventures',
      'President Scout Award',
      'Squire',
      'Yes',
      '',
      '2024-02-10',
      ''
    ];

    const sanitizeCol = (val: string) => {
      if (format === 'tsv') {
        return val.replace(/\t/g, ' ').replace(/\n/g, ' ');
      }
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const content = [
      headers.map(sanitizeCol).join(delim),
      row1.map(sanitizeCol).join(delim),
      row2.map(sanitizeCol).join(delim)
    ].join('\n');

    const mime = format === 'tsv' ? 'text/tab-separated-values;charset=utf-8;' : 'text/csv;charset=utf-8;';
    const filename = `arabiyya_members_template.${format}`;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseTextRows = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('Data does not contain enough rows (header and at least 1 data row required).');
    }

    const firstLine = lines[0];
    const isTab = firstLine.includes('\t');

    const parseLine = (line: string): string[] => {
      if (isTab) {
        return line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
      }
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseLine(lines[0]);
    const parsedMembers = [];
    for (let i = 1; i < lines.length; i++) {
      const rowValues = parseLine(lines[i]);
      if (rowValues.every(c => c === '')) continue;
      const rowObj: any = {};
      headers.forEach((header, idx) => {
        rowObj[header] = rowValues[idx] || '';
      });
      parsedMembers.push(rowObj);
    }
    return parsedMembers;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      let rawText = '';
      if (activeTab === 'file') {
        if (!file) throw new Error('Please select a CSV or TSV file to upload.');
        rawText = await file.text();
      } else {
        if (!pasteData.trim()) throw new Error('Please paste data copied from your spreadsheet.');
        rawText = pasteData.trim();
      }

      const parsedMembers = parseTextRows(rawText);
      if (parsedMembers.length === 0) {
        throw new Error('No valid member rows could be extracted from input.');
      }

      const res = await fetch('/api/admin/members/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: parsedMembers,
          syncExisting: syncExisting
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk operation failed.');

      setResult({
        createdCount: data.createdCount || 0,
        updatedCount: data.updatedCount || 0,
        totalCount: data.totalCount || ((data.createdCount || 0) + (data.updatedCount || 0)),
        errors: data.errors || []
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error processing bulk upload.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-darkblue text-white rounded-t-3xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-sky-300">
              Bulk Data Integration
            </div>
            <h3 className="text-lg font-bold">Bulk Add & Sync Members</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Step 1: Download Templates */}
          <div className="bg-sky-50/80 border border-sky-200 p-4 rounded-2xl space-y-2.5">
            <div className="font-bold text-darkblue text-sm flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Step 1: Download Member Template (All 24 Fields)</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Includes all 24 tracked fields gathered on the Join page: Full Name, Common Name, ID Card Number, Date of Birth, Age, Gender, Permanent Address, Current Address, Emergency Contact Name, Emergency Relationship, Emergency Contact Number, Email Address, Mobile, Phone, Telegram Number, Telegram Tag, WhatsApp, Instagram Tag, Award Goal, Current Level, Is New To Scouting, Last Scout Group, Investiture Date, and Resignation Date.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadTemplate('csv')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV Template</span>
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate('tsv')}
                className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download TSV (Excel / Sheets)</span>
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-emerald-900">
              <div className="font-bold text-sm flex items-center space-x-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Sync Complete: Processed {result.totalCount} Member Record(s)!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  <span className="font-semibold text-gray-500 block">Newly Created:</span>
                  <span className="font-black text-emerald-700 text-base">{result.createdCount}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  <span className="font-semibold text-gray-500 block">Updated / Synced:</span>
                  <span className="font-black text-sky-700 text-base">{result.updatedCount}</span>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="text-[11px] text-red-700 space-y-1 pt-2 border-t border-emerald-200">
                  <div className="font-bold">Warnings:</div>
                  {result.errors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Input Method */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-bold text-darkblue text-sm flex items-center space-x-2">
                <Upload className="w-4 h-4 text-maroon" />
                <span>Step 2: Provide Member Data</span>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeTab === 'file'
                      ? 'bg-white text-darkblue shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeTab === 'paste'
                      ? 'bg-white text-darkblue shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Paste Data
                </button>
              </div>
            </div>

            {activeTab === 'file' ? (
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center space-y-2 bg-gray-50/50">
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-maroon file:text-white hover:file:bg-[#660000]"
                />
                <div className="text-[11px] text-gray-400">
                  Accepts .csv (comma separated) or .tsv (tab separated) files.
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-gray-600 font-medium">
                  Paste rows directly from your Google Sheets or Excel table:
                </label>
                <textarea
                  rows={6}
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder={`Full Name\tID Card Number\tDate of Birth\tAge\tPermanent Address...\nAhmed Hassan\tA100001\t2004-03-15\t20\tM. Rose...`}
                  className="w-full p-3 font-mono text-[11px] border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white"
                />
              </div>
            )}

            {/* Sync & Investiture Date Options */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
              <label className="flex items-start space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncExisting}
                  onChange={(e) => setSyncExisting(e.target.checked)}
                  className="mt-0.5 rounded text-maroon focus:ring-maroon"
                />
                <div>
                  <span className="font-bold text-amber-950 block">
                    Sync & update existing members matching ID Card Number
                  </span>
                  <span className="text-[11px] text-amber-900 block leading-tight">
                    Allows updating Investiture Date, Status, Attendance %, and Contact details for members already in the system, while creating any new members.
                  </span>
                </div>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-xl font-bold hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting || (activeTab === 'file' && !file) || (activeTab === 'paste' && !pasteData.trim())}
                className="px-5 py-2 bg-maroon text-white font-bold rounded-xl hover:bg-[#660000] disabled:opacity-50 flex items-center space-x-1.5 shadow-xs"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Bulk Data...</span>
                  </>
                ) : (
                  <span>Import & Sync Members</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
