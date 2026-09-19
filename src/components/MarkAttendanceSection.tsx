import React, { useState, useEffect } from 'react';
import { formatDateTimeDDMMMYYYY } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { EventItem, AttendanceRecord, MemberApplication, MeetingMinute } from '../types';
import { 
  CheckSquare, 
  Check,
  Clock, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Save, 
  Calendar, 
  Users, 
  Search, 
  Filter, 
  ShieldAlert,
  FileText,
  Info,
  MapPin,
  Download
} from 'lucide-react';
import {
  getMemberCurrentCity,
  isMemberVoluntarilySuspended,
  evaluateEventRequirementForMember
} from '../utils/memberHelpers';
import { AttendanceExportCenter } from './AttendanceExportCenter';

interface MarkAttendanceSectionProps {
  // Pass necessary data or fetch inside
}

export const MarkAttendanceSection: React.FC<MarkAttendanceSectionProps> = () => {
  const { user } = useAuth();
  const isSecretary = user?.role === 'Secretary';

  const [events, setEvents] = useState<EventItem[]>([]);
  const [members, setMembers] = useState<MemberApplication[]>([]);
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinute[]>([]);
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected event
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [statusMap, setStatusMap] = useState<Record<string, 'Attended' | 'Excused' | 'Unable To Attend' | 'Not Required'>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<'All' | 'Open' | 'Locked'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [evtsRes, memsRes, attRes, minRes] = await Promise.all([
        fetch('/api/events?isSecretary=true').then(r => r.json()),
        fetch('/api/members').then(r => r.json()),
        fetch('/api/attendance?isSecretary=true').then(r => r.json()),
        fetch('/api/meeting-minutes').then(r => r.json())
      ]);

      const loadedEvts: EventItem[] = Array.isArray(evtsRes) ? evtsRes : [];
      const loadedMems: MemberApplication[] = Array.isArray(memsRes) ? memsRes : [];
      const loadedAtt: AttendanceRecord[] = Array.isArray(attRes) ? attRes : [];
      const loadedMin: MeetingMinute[] = Array.isArray(minRes) ? minRes : [];

      setEvents(loadedEvts);
      setMembers(loadedMems);
      setExistingAttendance(loadedAtt);
      setMeetingMinutes(loadedMin);

      if (loadedEvts.length > 0 && !selectedEventId) {
        setSelectedEventId(loadedEvts[0].id);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSecretary) {
      loadData();
    }
  }, [user]);

  // When selected event changes, populate statusMap from existing attendance
  useEffect(() => {
    if (!selectedEventId || members.length === 0) return;

    const currentEvt = events.find(e => e.id === selectedEventId);
    const eventAttRecords = existingAttendance.filter(a => a.eventId === selectedEventId);
    const initialMap: Record<string, 'Attended' | 'Excused' | 'Unable To Attend' | 'Not Required'> = {};

    members.forEach(mem => {
      const record = eventAttRecords.find(a => a.memberId === mem.id);
      if (record && record.status && record.status !== 'Pending' && record.status !== 'Absent' && record.status !== 'Upcoming') {
        initialMap[mem.id] = record.status;
      } else if (currentEvt) {
        const evaluation = evaluateEventRequirementForMember(currentEvt, mem);
        if (evaluation.isSuspended) {
          initialMap[mem.id] = 'Excused';
        } else if (!evaluation.isRequired) {
          initialMap[mem.id] = 'Not Required';
        } else {
          initialMap[mem.id] = 'Attended';
        }
      } else {
        initialMap[mem.id] = 'Attended';
      }
    });

    setStatusMap(initialMap);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  }, [selectedEventId, existingAttendance, members, events]);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Determine lock rules for an event
  const getEventLockStatus = (evt: EventItem) => {
    const minutesExist = evt.minutesPublished || meetingMinutes.some(m => m.eventId === evt.id && m.isPublished);
    if (minutesExist) {
      return { isLocked: true, reason: 'Meeting Minutes Published', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' };
    }

    if (evt.toDateTime) {
      const endTime = new Date(evt.toDateTime).getTime();
      const hoursSinceEnd = (Date.now() - endTime) / (1000 * 60 * 60);
      if (hoursSinceEnd > 48) {
        return { isLocked: true, reason: '48-Hour Marking Window Expired', badgeColor: 'bg-red-100 text-red-900 border-red-300' };
      } else if (hoursSinceEnd >= 0) {
        const remainingHours = Math.max(0, Math.round(48 - hoursSinceEnd));
        return { isLocked: false, reason: `Open (${remainingHours}h remaining)`, badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      }
    }

    return { isLocked: false, reason: 'Open for Marking', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
  };

  const currentLockInfo = selectedEvent ? getEventLockStatus(selectedEvent) : { isLocked: true, reason: 'No Event Selected', badgeColor: '' };

  const handleStatusChange = (memberId: string, status: 'Attended' | 'Excused' | 'Unable To Attend' | 'Not Required') => {
    if (currentLockInfo.isLocked) return;
    setStatusMap(prev => ({ ...prev, [memberId]: status }));
  };

  const handleMarkAll = (status: 'Attended' | 'Unable To Attend') => {
    if (currentLockInfo.isLocked) return;
    const newMap: Record<string, 'Attended' | 'Excused' | 'Unable To Attend' | 'Not Required'> = {};
    members.forEach(m => {
      newMap[m.id] = status;
    });
    setStatusMap(newMap);
  };

  const handleSaveAttendance = async () => {
    if (!selectedEvent || currentLockInfo.isLocked) return;

    setSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    const recordsToSubmit = members.map(mem => ({
      memberId: mem.id,
      memberName: mem.fullName,
      memberCommonName: mem.commonName || mem.fullName,
      status: statusMap[mem.id] || 'Attended'
    }));

    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          records: recordsToSubmit
        })
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok) {
        setSaveSuccessMsg(`Attendance records for "${selectedEvent.name}" successfully updated and synchronized!`);
        loadData();
      } else {
        setSaveErrorMsg(data.error || 'Failed to save attendance.');
      }
    } catch (err) {
      setSaving(false);
      setSaveErrorMsg('Server error while saving attendance records.');
    }
  };

  // Filter events list
  const filteredEvents = events.filter(evt => {
    const lockInfo = getEventLockStatus(evt);
    if (filterType === 'Open' && lockInfo.isLocked) return false;
    if (filterType === 'Locked' && !lockInfo.isLocked) return false;
    if (searchTerm && !evt.name.toLowerCase().includes(searchTerm.toLowerCase()) && !evt.eventType.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Secretary Attendance Export Center (PDF, XLSX, CSV) */}
      <AttendanceExportCenter
        events={events}
        members={members}
        records={existingAttendance}
        meetingMinutes={meetingMinutes}
        selectedEventId={selectedEventId}
        onSelectEventId={(id) => setSelectedEventId(id)}
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-darkblue">Attendance Administration</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select an event to update participant check-ins, approve absence excuses, or synchronize roster attendance.
            </p>
          </div>
        </div>
        
        {/* Main Grid: Event Selector Sidebar + Attendance Marking Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Event Selector List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h2 className="text-xs font-bold text-darkblue uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-maroon" />
                  <span>Select Event ({filteredEvents.length})</span>
                </h2>
              </div>

              {/* Search and Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:bg-white"
                  />
                </div>

                <div className="flex items-center space-x-1 text-[11px] font-semibold">
                  {(['All', 'Open', 'Locked'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`flex-1 py-1 rounded-lg border text-center transition-all ${
                        filterType === type 
                          ? 'bg-darkblue text-white border-darkblue font-bold shadow-2xs' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Events Cards List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="text-center py-8 text-xs text-gray-400">Loading events...</div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">No events found.</div>
                ) : (
                  filteredEvents.map(evt => {
                    const lockInfo = getEventLockStatus(evt);
                    const isSelected = evt.id === selectedEventId;

                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEventId(evt.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-maroon bg-amber-50/30 ring-1 ring-maroon/30 shadow-2xs' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1 gap-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-darkblue rounded-full">
                              {evt.eventType}
                            </span>
                            {evt.isSignUpEvent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-pink-100 text-pink-800 border border-pink-200 rounded-full inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                Sign Up
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full shrink-0 ${lockInfo.badgeColor}`}>
                            {lockInfo.isLocked ? <Lock className="w-2.5 h-2.5 inline mr-1" /> : null}
                            {lockInfo.reason}
                          </span>
                        </div>

                        <h3 className="font-bold text-darkblue text-xs line-clamp-1 mb-1">{evt.name}</h3>
                        <div className="text-[11px] text-gray-500 flex items-center space-x-1 font-mono">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{evt.fromDateTime ? formatDateTimeDDMMMYYYY(evt.fromDateTime) : 'TBD'}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Attendance Marking Canvas */}
          <div className="lg:col-span-8 space-y-4">
            {selectedEvent ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-5">
                
                {/* Event Meta Banner */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-maroon text-white rounded-full">
                        {selectedEvent.eventType}
                      </span>
                      {selectedEvent.isSignUpEvent && (
                        <span className="text-xs font-bold px-2.5 py-0.5 bg-pink-100 text-pink-900 border border-pink-300 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-pink-500" />
                          Open Sign Up Event
                        </span>
                      )}
                      <span className={`text-xs font-bold px-2.5 py-0.5 border rounded-full ${currentLockInfo.badgeColor}`}>
                        {currentLockInfo.reason}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-darkblue mt-1.5">{selectedEvent.name}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      📍 {selectedEvent.location || 'Arabiyya Scouting HQ'} • Scheduled: <span className="font-mono text-gray-700">{selectedEvent.fromDateTime ? formatDateTimeDDMMMYYYY(selectedEvent.fromDateTime) : 'TBD'} to {selectedEvent.toDateTime ? formatDateTimeDDMMMYYYY(selectedEvent.toDateTime) : 'TBD'}</span>
                    </p>
                  </div>

                  {/* Lock Indicator */}
                  {currentLockInfo.isLocked && (
                    <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs font-bold flex items-center space-x-2 shrink-0">
                      <Lock className="w-4 h-4 text-maroon" />
                      <span>Attendance Locked</span>
                    </div>
                  )}
                </div>

                {/* Status Alert Banners */}
                {currentLockInfo.isLocked && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-start space-x-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Attendance Marking Frozen:</strong> {currentLockInfo.reason === 'Meeting Minutes Published' ? 'Meeting Minutes have been published for this event. Attendance records are officially finalized.' : 'More than 48 hours have passed since the event conclusion.'} No further changes can be submitted.
                    </div>
                  </div>
                )}

                {saveSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                    <button onClick={() => setSaveSuccessMsg(null)} className="text-gray-400 hover:text-gray-600">×</button>
                  </div>
                )}

                {saveErrorMsg && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs font-bold rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span>{saveErrorMsg}</span>
                    </div>
                    <button onClick={() => setSaveErrorMsg(null)} className="text-gray-400 hover:text-gray-600">×</button>
                  </div>
                )}

                {/* Quick Action Controls (if not locked) */}
                {!currentLockInfo.isLocked && (
                  <div className="flex flex-wrap justify-between items-center gap-3 pt-2 pb-1 border-b border-gray-100">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-500">
                      <Users className="w-4 h-4 text-maroon" />
                      <span>Roster ({members.length} Active Members)</span>
                    </div>

                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      {selectedEvent.isSignUpEvent && Array.isArray(selectedEvent.signedUpMembers) && selectedEvent.signedUpMembers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusMap(prev => {
                              const next = { ...prev };
                              (selectedEvent.signedUpMembers || []).forEach(mId => {
                                next[mId] = 'Attended';
                              });
                              return next;
                            });
                          }}
                          className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <span className="w-2 h-2 rounded-full bg-pink-500" />
                          <span>Mark Signed-Up Attended</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleMarkAll('Attended')}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        Mark All Attended
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkAll('Unable To Attend')}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        Mark All Absent
                      </button>
                    </div>
                  </div>
                )}

                {/* Attendance Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        <th className="py-3 px-4">Member Name</th>
                        <th className="py-3 px-4">Section / Role</th>
                        <th className="py-3 px-4">ID Card</th>
                        <th className="py-3 px-4 text-right">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-400">No active members found in roster.</td>
                        </tr>
                      ) : (
                        members.map((mem) => {
                          const currentStatus = statusMap[mem.id] || 'Attended';
                          const existingRec = existingAttendance.find(a => a.eventId === selectedEvent.id && a.memberId === mem.id);
                          const memberCity = getMemberCurrentCity(mem);
                          const isSuspended = isMemberVoluntarilySuspended(mem);
                          const evalReq = evaluateEventRequirementForMember(selectedEvent, mem);
                          const isSignedUp = Boolean(Array.isArray(selectedEvent.signedUpMembers) && selectedEvent.signedUpMembers.includes(mem.id));

                          return (
                            <tr key={mem.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-3 px-4 font-bold text-darkblue">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span>{mem.fullName}</span>
                                  {mem.commonName && <span className="text-[10px] text-gray-500 font-normal">({mem.commonName})</span>}
                                  {isSignedUp && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-pink-50 text-pink-700 border border-pink-200 text-[9px] font-bold rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                                      Signed Up
                                    </span>
                                  )}
                                  {isSuspended && (
                                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold rounded-md">
                                      Voluntary Suspended
                                    </span>
                                  )}
                                  {!isSuspended && !selectedEvent.isSignUpEvent && !evalReq.isRequired && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 text-[9px] font-semibold rounded-md">
                                      Location Exempt
                                    </span>
                                  )}
                                </div>
                                {memberCity && (
                                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-normal mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-gray-400" />
                                    <span>{memberCity}</span>
                                  </div>
                                )}
                                {existingRec?.excuseReason && (
                                  <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-md border border-amber-200">
                                    <strong>Excuse Note:</strong> {existingRec.excuseReason}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-900 rounded-full">
                                  {mem.role}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-gray-500 text-[11px]">
                                {mem.idCardNumber}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {currentLockInfo.isLocked ? (
                                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 ${
                                    currentStatus === 'Attended' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                                    currentStatus === 'Excused' ? 'bg-amber-100 text-amber-900' :
                                    currentStatus === 'Unable To Attend' ? 'bg-red-100 text-red-900' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {currentStatus === 'Attended' && (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                        {isSignedUp && (
                                          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 ring-pink-200 shrink-0 inline-block shadow-xs" title="Signed Up Member" />
                                        )}
                                      </>
                                    )}
                                    <span>{currentStatus}</span>
                                  </span>
                                ) : (
                                  <div className="inline-flex items-center space-x-1">
                                    {(['Attended', 'Excused', 'Unable To Attend', 'Not Required'] as const).map(st => (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={() => handleStatusChange(mem.id, st)}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all inline-flex items-center gap-1.5 ${
                                          currentStatus === st 
                                            ? st === 'Attended' ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' :
                                              st === 'Excused' ? 'bg-amber-500 text-white border-amber-500' :
                                              st === 'Unable To Attend' ? 'bg-maroon text-white border-maroon' : 'bg-gray-600 text-white border-gray-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                      >
                                        {st === 'Attended' && (
                                          <>
                                            <Check className="w-3.5 h-3.5 shrink-0" />
                                            {isSignedUp && (
                                              <span
                                                className={`w-2 h-2 rounded-full shrink-0 inline-block shadow-2xs ${
                                                  currentStatus === 'Attended' ? 'bg-pink-300 ring-1 ring-white' : 'bg-pink-500 ring-1 ring-pink-300'
                                                }`}
                                                title="Signed Up Member"
                                              />
                                            )}
                                          </>
                                        )}
                                        <span>{st === 'Attended' ? 'Attended' : st === 'Excused' ? 'Excused' : st === 'Unable To Attend' ? 'Absent' : 'N/R'}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Submit Button */}
                {!currentLockInfo.isLocked && (
                  <div className="flex justify-end pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleSaveAttendance}
                      disabled={saving}
                      className="px-6 py-2.5 bg-maroon hover:bg-[#660000] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Synchronizing...' : 'Save & Publish Attendance'}</span>
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
                Select an event from the left list to view or mark attendance.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
