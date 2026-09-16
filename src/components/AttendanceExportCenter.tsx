import React, { useState } from 'react';
import { formatDateTimeDDMMMYYYY } from '../utils/dateUtils';
import { EventItem, MemberApplication, AttendanceRecord, MeetingMinute } from '../types';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  User,
  ChevronDown,
  Search,
  Info,
  MapPin,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  downloadEventAttendancePDF,
  downloadEventAttendanceXLSX,
  downloadEventAttendanceCSV,
  downloadMasterSheetPDF,
  downloadMasterSheetXLSX,
  downloadMasterSheetCSV,
  downloadMemberAttendancePDF,
  downloadMemberAttendanceXLSX,
  downloadMemberAttendanceCSV
} from '../utils/attendanceExportHelpers';
import {
  getMemberCurrentCity,
  isMemberVoluntarilySuspended
} from '../utils/memberHelpers';

interface AttendanceExportCenterProps {
  events: EventItem[];
  members: MemberApplication[];
  records: AttendanceRecord[];
  meetingMinutes?: MeetingMinute[];
  selectedEventId?: string;
  onSelectEventId?: (eventId: string) => void;
  selectedMemberId?: string;
  onSelectMemberId?: (memberId: string) => void;
}

export const AttendanceExportCenter: React.FC<AttendanceExportCenterProps> = ({
  events,
  members,
  records,
  meetingMinutes = [],
  selectedEventId,
  onSelectEventId,
  selectedMemberId,
  onSelectMemberId
}) => {
  const [activeScope, setActiveScope] = useState<'mastersheet' | 'event' | 'member'>('mastersheet');
  const [activeEventId, setActiveEventId] = useState<string>(selectedEventId || (events[0]?.id || ''));
  const [activeMemberId, setActiveMemberId] = useState<string>(selectedMemberId || (members[0]?.id || ''));
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Synchronize when parent changes selectedEventId
  React.useEffect(() => {
    if (selectedEventId) {
      setActiveEventId(selectedEventId);
    }
  }, [selectedEventId]);

  // Synchronize when parent changes selectedMemberId
  React.useEffect(() => {
    if (selectedMemberId) {
      setActiveMemberId(selectedMemberId);
    }
  }, [selectedMemberId]);

  const currentEvent = events.find(e => e.id === activeEventId) || events[0];
  const currentMinute = meetingMinutes.find(m => m.eventId === currentEvent?.id);
  const currentMember = members.find(m => m.id === activeMemberId) || members[0];

  const filteredMembers = members.filter(m => {
    if (!memberSearchTerm) return true;
    const term = memberSearchTerm.toLowerCase();
    return (
      (m.fullName && m.fullName.toLowerCase().includes(term)) ||
      (m.commonName && m.commonName.toLowerCase().includes(term)) ||
      (m.role && m.role.toLowerCase().includes(term)) ||
      (m.permanentCity && m.permanentCity.toLowerCase().includes(term)) ||
      (m.temporaryCity && m.temporaryCity.toLowerCase().includes(term))
    );
  });

  const handleExport = async (format: 'pdf' | 'xlsx' | 'csv') => {
    setExportingType(format);
    setSuccessMsg(null);

    try {
      if (activeScope === 'event') {
        if (!currentEvent) {
          alert('Please select an event to export.');
          setExportingType(null);
          return;
        }

        const data = {
          event: currentEvent,
          members,
          records,
          meetingMinute: currentMinute
        };

        if (format === 'pdf') {
          downloadEventAttendancePDF(data);
          setSuccessMsg(`PDF Report for event "${currentEvent.name}" generated successfully!`);
        } else if (format === 'xlsx') {
          downloadEventAttendanceXLSX(data);
          setSuccessMsg(`Excel Workbook (.xlsx) for event "${currentEvent.name}" generated successfully!`);
        } else if (format === 'csv') {
          downloadEventAttendanceCSV(data);
          setSuccessMsg(`Editable CSV for event "${currentEvent.name}" generated successfully!`);
        }
      } else if (activeScope === 'member') {
        if (!currentMember) {
          alert('Please select a member to export.');
          setExportingType(null);
          return;
        }

        const data = {
          member: currentMember,
          events,
          records
        };

        if (format === 'pdf') {
          downloadMemberAttendancePDF(data);
          setSuccessMsg(`Individual PDF Attendance Report for "${currentMember.fullName}" generated successfully!`);
        } else if (format === 'xlsx') {
          downloadMemberAttendanceXLSX(data);
          setSuccessMsg(`Excel Workbook (.xlsx) for "${currentMember.fullName}" generated successfully!`);
        } else if (format === 'csv') {
          downloadMemberAttendanceCSV(data);
          setSuccessMsg(`CSV Attendance Data for "${currentMember.fullName}" generated successfully!`);
        }
      } else {
        // Master Sheet across all members and events
        const data = {
          events,
          members,
          records
        };

        if (format === 'pdf') {
          downloadMasterSheetPDF(data);
          setSuccessMsg('Attendance Master Sheet PDF generated successfully!');
        } else if (format === 'xlsx') {
          downloadMasterSheetXLSX(data);
          setSuccessMsg('Attendance Master Sheet Excel Workbook (.xlsx) generated successfully!');
        } else if (format === 'csv') {
          downloadMasterSheetCSV(data);
          setSuccessMsg('Attendance Master Sheet CSV generated successfully!');
        }
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to generate export file. Please try again.');
    } finally {
      setExportingType(null);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  return (
    <div className="bg-darkblue rounded-2xl border border-blue-900/60 shadow-md overflow-hidden text-white">
      {/* Header Banner - Dark Blue Scout Theme with White Typography */}
      <div className="bg-gradient-to-r from-darkblue via-blue-950 to-darkblue px-6 py-5 border-b border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20 shadow-inner">
            <Download className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Secretary Attendance Report Center
              </h3>
              <span className="px-2.5 py-0.5 bg-amber-400 text-darkblue text-[10px] font-black uppercase rounded-md tracking-wider shadow-xs">
                Secretary Access Only
              </span>
            </div>
            <p className="text-xs text-blue-100/90 mt-1 font-medium leading-relaxed">
              Generate and download official PDF reports, Excel workbooks (.xlsx), or editable CSV sheets by Master Sheet, Event, or Member
            </p>
          </div>
        </div>

        {/* Scope Selector Tabs: Mastersheet vs Single Event vs Specific Member */}
        <div className="flex items-center bg-white/10 backdrop-blur-xs p-1 rounded-xl border border-white/15 text-xs font-bold w-full lg:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveScope('mastersheet')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeScope === 'mastersheet'
                ? 'bg-white text-darkblue shadow-md font-black'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Sheet ({events.length} Events)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScope('event')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeScope === 'event'
                ? 'bg-white text-darkblue shadow-md font-black'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Single Event</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScope('member')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeScope === 'member'
                ? 'bg-white text-darkblue shadow-md font-black'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-300" />
            <span>Member Report ({members.length})</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Scope 1: Event Selector */}
        {activeScope === 'event' && (
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-amber-300" />
                <span>Select Event to Export:</span>
              </label>
              {currentEvent && (
                <span className="text-[11px] font-semibold text-blue-200">
                  Type: <strong className="text-white">{currentEvent.eventType}</strong> • Schedule: {formatDateTimeDDMMMYYYY(currentEvent.fromDateTime)}
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={activeEventId}
                onChange={(e) => {
                  setActiveEventId(e.target.value);
                  if (onSelectEventId) onSelectEventId(e.target.value);
                }}
                className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-blue-950/80 border border-white/20 rounded-xl font-bold text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-2xs cursor-pointer"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id} className="bg-darkblue text-white">
                    {evt.name} — ({evt.eventType} | {formatDateTimeDDMMMYYYY(evt.fromDateTime)})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-blue-200">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {currentEvent?.requiredCities && currentEvent.requiredCities.length > 0 && (
              <p className="text-[11px] text-amber-200 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-400/20 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Location-Specific Event: Attendance required for members in <strong className="text-white">{currentEvent.requiredCities.join(', ')}</strong> (exempt for other regions).</span>
              </p>
            )}
          </div>
        )}

        {/* Scope 2: Member Selector */}
        {activeScope === 'member' && (
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <User className="w-4 h-4 text-amber-300" />
                <span>Select Member to Export ({members.length} Total):</span>
              </label>
              {currentMember && (
                <div className="flex items-center space-x-2 text-[11px] font-semibold text-blue-200">
                  <span>Section: <strong className="text-white">{currentMember.role || 'Member'}</strong></span>
                  <span>•</span>
                  <span>City: <strong className="text-white">{getMemberCurrentCity(currentMember) || 'N/A'}</strong></span>
                  {isMemberVoluntarilySuspended(currentMember) && (
                    <span className="px-2 py-0.5 bg-red-500/20 border border-red-400/30 text-red-200 text-[10px] font-bold rounded">Suspended</span>
                  )}
                </div>
              )}
            </div>

            {/* Quick Member Filter Input */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-4 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-blue-300" />
                <input
                  type="text"
                  placeholder="Filter by name, role or city..."
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-blue-950/80 border border-white/20 rounded-xl text-white placeholder-blue-300/60 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-8 relative">
                <select
                  value={activeMemberId}
                  onChange={(e) => {
                    setActiveMemberId(e.target.value);
                    if (onSelectMemberId) onSelectMemberId(e.target.value);
                  }}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-blue-950/80 border border-white/20 rounded-xl font-bold text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-2xs cursor-pointer"
                >
                  {filteredMembers.map((mem) => {
                    const city = getMemberCurrentCity(mem);
                    const isSusp = isMemberVoluntarilySuspended(mem);
                    return (
                      <option key={mem.id} value={mem.id} className="bg-darkblue text-white">
                        {mem.fullName} {mem.commonName ? `(${mem.commonName})` : ''} — [{mem.role || 'Member'}] — City: {city || 'N/A'} {isSusp ? '(Suspended)' : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-blue-200">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {currentMember && (() => {
              // Calculate mini statistics for the selected member
              let att = 0;
              let exc = 0;
              let abs = 0;
              let exempt = 0;

              events.forEach(evt => {
                const rec = records.find(r => r.eventId === evt.id && (r.memberId === currentMember.id || r.memberName === currentMember.fullName));
                const isPast = evt.toDateTime ? new Date(evt.toDateTime).getTime() < Date.now() : false;
                const isSusp = isMemberVoluntarilySuspended(currentMember);
                let st = rec?.status;
                if (!st) {
                  if (isSusp) st = 'Excused';
                  else if (isPast) st = 'Absent';
                  else st = 'Upcoming';
                }
                if (st === 'Attended') att++;
                else if (st === 'Excused') exc++;
                else if (st === 'Unable To Attend' || st === 'Absent') abs++;
                else if (st === 'Not Required') exempt++;
              });

              const totalConcluded = att + exc + abs;
              const rateWithExcused = totalConcluded > 0 ? Math.round(((att + exc) / totalConcluded) * 100) : 100;

              return (
                <div className="mt-2 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-100">
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-blue-200">Record Overview:</span>
                    <span>Attended: <strong className="text-emerald-300">{att}</strong></span>
                    <span>Excused: <strong className="text-amber-300">{exc}</strong></span>
                    <span>Absent: <strong className="text-red-300">{abs}</strong></span>
                    <span>Exempt: <strong className="text-blue-200">{exempt}</strong></span>
                  </div>
                  <div className="font-bold text-white">
                    Compliance Rate: <span className={rateWithExcused >= 80 ? 'text-emerald-300 font-extrabold' : 'text-red-300 font-extrabold'}>{rateWithExcused}%</span> (With Excuses)
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Scope 3: Master Sheet Overview Info */}
        {activeScope === 'mastersheet' && (
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-start space-x-3">
            <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-100 leading-relaxed">
              <strong className="text-white">Master Sheet Overview:</strong> Exports a complete cross-matrix of all <strong className="text-white">{members.length} members</strong> across all <strong className="text-white">{events.length} tracked events</strong>, including voluntary suspension auto-excuses, individual attendance rates (with/without excused), and regional exemptions.
            </div>
          </div>
        )}

        {/* Action Export Cards - Dark Blue Cards with White Text & Accent Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: PDF Document */}
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={exportingType !== null || (activeScope === 'event' && !currentEvent) || (activeScope === 'member' && !currentMember)}
            className="p-5 rounded-2xl border border-white/15 hover:border-amber-400/80 bg-blue-950/70 hover:bg-blue-900/80 transition-all text-left group flex flex-col justify-between shadow-md hover:shadow-xl disabled:opacity-50 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-amber-400/20 border border-white/15 flex items-center justify-center transition-colors">
                  <FileText className="w-5 h-5 text-amber-300" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/10 text-white border border-white/20">
                  PDF Report
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {activeScope === 'event'
                    ? 'Download Event PDF'
                    : activeScope === 'member'
                    ? 'Download Member PDF'
                    : 'Download Master PDF'}
                </h4>
                <p className="text-[11px] text-blue-200/90 leading-relaxed">
                  {activeScope === 'event'
                    ? 'Stylized executive report with KPIs, attendance breakdown & linked minutes.'
                    : activeScope === 'member'
                    ? `Personal attendance transcript and event record ledger for ${currentMember?.fullName || 'member'}.`
                    : 'Landscape ledger matrix covering all member participation rates and compliance summaries.'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-300 group-hover:text-amber-200">
              <span>{exportingType === 'pdf' ? 'Generating PDF...' : 'Download PDF Report'}</span>
              <Download className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
            </div>
          </button>

          {/* Card 2: Excel (.xlsx) */}
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            disabled={exportingType !== null || (activeScope === 'event' && !currentEvent) || (activeScope === 'member' && !currentMember)}
            className="p-5 rounded-2xl border border-white/15 hover:border-emerald-400/80 bg-blue-950/70 hover:bg-blue-900/80 transition-all text-left group flex flex-col justify-between shadow-md hover:shadow-xl disabled:opacity-50 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-emerald-400/20 border border-white/15 flex items-center justify-center transition-colors">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/10 text-white border border-white/20">
                  Excel (.xlsx)
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {activeScope === 'event'
                    ? 'Download Event Excel'
                    : activeScope === 'member'
                    ? 'Download Member Excel'
                    : 'Download Master Excel'}
                </h4>
                <p className="text-[11px] text-blue-200/90 leading-relaxed">
                  {activeScope === 'event'
                    ? 'Multi-sheet workbook containing Event Attendance Roster & Overview sheets.'
                    : activeScope === 'member'
                    ? `Two-sheet workbook featuring ${currentMember?.fullName || 'member'}'s Event Log & Summary.`
                    : 'Comprehensive multi-sheet workbook with full cross-matrix attendance & per-event statistics.'}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
              <span>{exportingType === 'xlsx' ? 'Preparing Excel...' : 'Download Excel (.xlsx)'}</span>
              <Download className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
            </div>
          </button>

          {/* Card 3: CSV Data */}
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={exportingType !== null || (activeScope === 'event' && !currentEvent) || (activeScope === 'member' && !currentMember)}
            className="p-5 rounded-2xl border border-white/15 hover:border-sky-400/80 bg-blue-950/70 hover:bg-blue-900/80 transition-all text-left group flex flex-col justify-between shadow-md hover:shadow-xl disabled:opacity-50 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-sky-400/20 border border-white/15 flex items-center justify-center transition-colors">
                  <FileCode className="w-5 h-5 text-sky-300" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/10 text-white border border-white/20">
                  CSV File
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                  {activeScope === 'event'
                    ? 'Download Event CSV'
                    : activeScope === 'member'
                    ? 'Download Member CSV'
                    : 'Download Master CSV'}
                </h4>
                <p className="text-[11px] text-blue-200/90 leading-relaxed">
                  {activeScope === 'event'
                    ? 'UTF-8 encoded comma-separated table ready for Google Sheets, Numbers, or Excel.'
                    : activeScope === 'member'
                    ? 'Individual event participation data ready for spreadsheet analysis and formulas.'
                    : 'Universal tabular matrix ready for spreadsheet import and custom reporting.'}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-sky-300 group-hover:text-sky-200">
              <span>{exportingType === 'csv' ? 'Generating CSV...' : 'Download CSV File'}</span>
              <Download className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
            </div>
          </button>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
