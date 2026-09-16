import React, { useState, useEffect } from 'react';
import { formatDateTimeDDMMMYYYY } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { LogoImage } from '../components/LogoImage';
import { AttendanceRecord, EventItem } from '../types';
import { CheckSquare, AlertCircle, Clock, Lock, Send, ShieldAlert, CheckCircle2, UserCheck, X, LogIn, FileText, MapPin, Info } from 'lucide-react';
import { MarkAttendanceSection } from '../components/MarkAttendanceSection';
import {
  isMemberVoluntarilySuspended,
  getMemberCurrentCity,
  evaluateEventRequirementForMember
} from '../utils/memberHelpers';

interface AttendancePageProps {
  onNavigate: (path: string) => void;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isSecretary = user?.role === 'Secretary';

  const [events, setEvents] = useState<EventItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Excuse Modal
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [excuseReason, setExcuseReason] = useState('');
  const [submittingExcuse, setSubmittingExcuse] = useState(false);
  const [excuseSubmittedMsg, setExcuseSubmittedMsg] = useState<string | null>(null);

  // Admin Override Modal
  const [adminRecordToEdit, setAdminRecordToEdit] = useState<AttendanceRecord | null>(null);
  const [adminNewStatus, setAdminNewStatus] = useState<'Attended' | 'Excused' | 'Unable To Attend' | 'Not Required'>('Attended');

  // Interactive Attendance Filter (All, Attended, Excused, Absent, Upcoming)
  const [filterStatus, setFilterStatus] = useState<'All' | 'Attended' | 'Excused' | 'Absent' | 'Upcoming'>('All');

  // Reminder trigger simulation state
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);

    fetch(`/api/events?isAdmin=${isSecretary ? 'true' : 'false'}`)
      .then(res => res.json())
      .then(evtsData => {
        setEvents(Array.isArray(evtsData) ? evtsData : []);

        const attUrl = isSecretary ? '/api/attendance?isSecretary=true' : `/api/attendance?memberId=${user?.id || ''}`;
        return fetch(attUrl);
      })
      .then(res => res.json())
      .then(attData => {
        setAttendanceRecords(Array.isArray(attData) ? attData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Check 48h locking rule: returns true if event end time was more than 48 hours ago
  const isLockedForMember = (evt: EventItem) => {
    const toTime = new Date(evt.toDateTime).getTime();
    const now = Date.now();
    const hoursSinceEnd = (now - toTime) / (1000 * 60 * 60);
    return hoursSinceEnd > 48;
  };

  // Submit Excuse Reason
  const handleSubmitExcuse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !excuseReason.trim()) return;

    // Strict client-side check: cannot submit absence if already marked attended
    const currentRecord = attendanceRecords.find(a => a.eventId === selectedEvent.id);
    if (currentRecord?.status === 'Attended') {
      alert('You have already been marked as Attended for this event. Absence excuses cannot be submitted after attendance is recorded.');
      setSelectedEvent(null);
      return;
    }

    setSubmittingExcuse(true);

    try {
      const res = await fetch('/api/attendance/excuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          memberId: user?.id,
          memberName: user?.fullName,
          excuseReason
        })
      });

      const data = await res.json();
      setSubmittingExcuse(false);

      if (res.ok) {
        setExcuseSubmittedMsg('Absence excuse successfully submitted for administrative review.');
        setSelectedEvent(null);
        setExcuseReason('');
        loadData();
      } else {
        alert(data.error || 'Failed to submit excuse.');
      }
    } catch (err) {
      setSubmittingExcuse(false);
      alert('Failed to submit excuse.');
    }
  };

  // Admin Override Attendance Status
  const handleAdminUpdateStatus = async () => {
    if (!adminRecordToEdit) return;

    try {
      const res = await fetch('/api/attendance/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: adminRecordToEdit.id,
          status: adminNewStatus,
          excuseStatus: adminNewStatus === 'Excused' ? 'Approved' : undefined
        })
      });

      if (res.ok) {
        setAdminRecordToEdit(null);
        loadData();
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // Simulate 3h post-completion reminder trigger
  const handleTriggerReminders = () => {
    setReminderMsg('System scanned logs: Automated email reminders dispatched to members without an active status 3 hours post-event completion.');
  };

  // Calculate user's personal attendance summary out of all events
  const attendanceSummary = React.useMemo(() => {
    let attended = 0;
    let excused = 0;
    let absent = 0;
    let upcoming = 0;
    let exempt = 0;
    const now = Date.now();

    events.forEach(evt => {
      const rec = attendanceRecords.find(a => a.eventId === evt.id);
      const isPast = evt.toDateTime ? new Date(evt.toDateTime).getTime() < now : false;
      const evaluation = user ? evaluateEventRequirementForMember(evt, user) : { isRequired: true, isSuspended: false };

      if (rec?.status === 'Attended') {
        attended++;
      } else if (rec?.status === 'Excused' || rec?.excuseStatus === 'Approved') {
        excused++;
      } else if (rec?.status === 'Not Required' || !evaluation.isRequired || evaluation.isSuspended) {
        // Location exempt or voluntary suspended
        if (isPast) {
          excused++; // Counted as excused / non-penalized
          exempt++;
        } else {
          upcoming++;
        }
      } else if (rec?.status === 'Absent' || rec?.status === 'Unable To Attend') {
        absent++;
      } else if (isPast) {
        absent++;
      } else {
        upcoming++;
      }
    });

    const totalConcluded = attended + excused + absent;
    
    // Rate with excused: (attended + excused) / totalConcluded (0% if no concluded events)
    const rateWithExcused = totalConcluded > 0 
      ? Math.round(((attended + excused) / totalConcluded) * 100) 
      : 0;

    // Rate without excused: attended / (attended + absent) (0% if no concluded events; 100% if only excused events exist)
    const rateWithoutExcused = (attended + absent) > 0 
      ? Math.round((attended / (attended + absent)) * 100) 
      : (excused > 0 ? 100 : 0);

    return {
      total: events.length,
      attended,
      excused,
      absent,
      upcoming,
      exempt,
      totalConcluded,
      rateWithExcused,
      rateWithoutExcused
    };
  }, [events, attendanceRecords, user]);

  const filteredEvents = React.useMemo(() => {
    if (filterStatus === 'All') return events;
    const now = Date.now();

    return events.filter(evt => {
      const rec = attendanceRecords.find(a => a.eventId === evt.id);
      const isPast = evt.toDateTime ? new Date(evt.toDateTime).getTime() < now : false;
      const evaluation = user ? evaluateEventRequirementForMember(evt, user) : { isRequired: true, isSuspended: false };

      if (filterStatus === 'Attended') return rec?.status === 'Attended';
      if (filterStatus === 'Excused') {
        return rec?.status === 'Excused' || rec?.excuseStatus === 'Approved' || (isPast && (!evaluation.isRequired || evaluation.isSuspended));
      }
      if (filterStatus === 'Absent') {
        if (!evaluation.isRequired || evaluation.isSuspended) return false;
        return rec?.status === 'Absent' || rec?.status === 'Unable To Attend' || (isPast && rec?.status !== 'Attended' && rec?.status !== 'Excused');
      }
      if (filterStatus === 'Upcoming') return !isPast && rec?.status !== 'Attended' && rec?.status !== 'Excused';
      return true;
    });
  }, [events, attendanceRecords, filterStatus, user]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-blue-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-white border border-sky-100 flex items-center justify-center p-1 mx-auto shadow-xs">
            <LogoImage className="w-full h-full object-contain" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-maroon">Access Restricted</div>
            <h1 className="text-2xl font-bold text-darkblue">My Attendance Records</h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              Attendance records, event check-in histories, and absence excuse submission forms are restricted to logged-in members. Please sign in to access your records.
            </p>
          </div>
          <div className="pt-2 flex flex-col space-y-3">
            <button
              onClick={() => onNavigate('/signin')}
              className="w-full py-3 bg-darkblue hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to View Attendance</span>
            </button>
            <button
              onClick={() => onNavigate('/join')}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-darkblue font-bold text-xs rounded-xl transition-colors"
            >
              Apply for Membership
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center space-x-2 text-maroon font-bold text-xs uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Attendance & Excuse Management</span>
          </div>
          <h1 className="text-2xl font-bold text-darkblue">My Attendance Log</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track event participation, check-ins, and submit absence excuses within the 48-hour post-event window.
          </p>
        </div>
      </div>

      {reminderMsg && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-darkblue text-xs font-bold rounded-xl flex items-center justify-between">
          <span>{reminderMsg}</span>
          <button onClick={() => setReminderMsg(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {excuseSubmittedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>{excuseSubmittedMsg}</span>
          <button onClick={() => setExcuseSubmittedMsg(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}



      {/* Attendance Summary - Personal Records Out Of All Events */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-darkblue">Attendance Summary</h2>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                My Records
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Out of all <strong>{attendanceSummary.total}</strong> group events: your breakdown of attended events, excused absences, unexcused absences, and upcoming activities.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
            <div>
              <span className="text-gray-500 font-medium">Attendance Rate: </span>
              <strong className="text-emerald-700 font-extrabold">{attendanceSummary.rateWithExcused}%</strong>
              <span className="text-[10px] text-gray-400 ml-1">(With Excused)</span>
            </div>
            <span className="text-gray-300">|</span>
            <div>
              <strong className="text-darkblue font-extrabold">{attendanceSummary.rateWithoutExcused}%</strong>
              <span className="text-[10px] text-gray-400 ml-1">(Without)</span>
            </div>
          </div>
        </div>

        {/* 4 Interactive Summary Badges / Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'Attended' ? 'All' : 'Attended')}
            className={`p-4 rounded-xl border text-left transition-all ${
              filterStatus === 'Attended'
                ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-emerald-50/60 border-emerald-100 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Attended</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-3xl font-extrabold text-emerald-700">{attendanceSummary.attended}</span>
            <p className="text-[10px] text-emerald-700/80 mt-1">Events successfully attended</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'Excused' ? 'All' : 'Excused')}
            className={`p-4 rounded-xl border text-left transition-all ${
              filterStatus === 'Excused'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-amber-50/60 border-amber-100 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Excused</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-3xl font-extrabold text-amber-700">{attendanceSummary.excused}</span>
            <p className="text-[10px] text-amber-700/80 mt-1">Submitted & approved excuses</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'Absent' ? 'All' : 'Absent')}
            className={`p-4 rounded-xl border text-left transition-all ${
              filterStatus === 'Absent'
                ? 'bg-red-100 border-red-400 ring-2 ring-red-500/20 shadow-xs'
                : 'bg-red-50/60 border-red-100 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-maroon uppercase tracking-wider">Absent</span>
              <AlertCircle className="w-4 h-4 text-maroon" />
            </div>
            <span className="text-3xl font-extrabold text-maroon">{attendanceSummary.absent}</span>
            <p className="text-[10px] text-red-700/80 mt-1">Unexcused missed events</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'Upcoming' ? 'All' : 'Upcoming')}
            className={`p-4 rounded-xl border text-left transition-all ${
              filterStatus === 'Upcoming'
                ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-500/20 shadow-xs'
                : 'bg-sky-50/60 border-sky-100 hover:border-sky-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Upcoming</span>
              <Lock className="w-4 h-4 text-sky-600" />
            </div>
            <span className="text-3xl font-extrabold text-sky-700">{attendanceSummary.upcoming}</span>
            <p className="text-[10px] text-sky-700/80 mt-1">Future scheduled events</p>
          </button>
        </div>

        {/* Filter Navigation Chips */}
        <div className="flex items-center space-x-2 pt-2 overflow-x-auto text-xs font-bold">
          <span className="text-gray-400 text-xs font-semibold mr-1 shrink-0">Filter by:</span>
          <button
            type="button"
            onClick={() => setFilterStatus('All')}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
              filterStatus === 'All'
                ? 'bg-darkblue text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Events ({attendanceSummary.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Attended')}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
              filterStatus === 'Attended'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Attended ({attendanceSummary.attended})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Excused')}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
              filterStatus === 'Excused'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Excused ({attendanceSummary.excused})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Absent')}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
              filterStatus === 'Absent'
                ? 'bg-maroon text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Absent ({attendanceSummary.absent})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Upcoming')}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
              filterStatus === 'Upcoming'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Upcoming ({attendanceSummary.upcoming})
          </button>
        </div>
      </div>

      {/* Events Attendance Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-darkblue">Event Attendance Directory</h2>
            {filterStatus !== 'All' && (
              <span className="px-2 py-0.5 bg-blue-100 text-darkblue text-[10px] font-bold rounded-full">
                Showing {filterStatus} ({filteredEvents.length})
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 font-medium">Total Listed: {filteredEvents.length} of {events.length}</span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-gray-500">Loading attendance logs...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-500">
            {filterStatus === 'All' ? 'No events currently listed.' : `No events found with status "${filterStatus}".`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Event Name</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status / Notes</th>
                  <th className="px-4 py-3">Absence Window</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filteredEvents.map((evt) => {
                  const record = attendanceRecords.find(a => a.eventId === evt.id);
                  const locked = isLockedForMember(evt);
                  const isAttended = record?.status === 'Attended';
                  const evaluation = user ? evaluateEventRequirementForMember(evt, user) : { isRequired: true, isSuspended: false, badgeStyle: '', statusLabel: '', reason: '' };
                  const isExempt = !evaluation.isRequired || evaluation.isSuspended;
                  const isSignedUp = Boolean(user && Array.isArray(evt.signedUpMembers) && (evt.signedUpMembers.includes(user.id) || evt.signedUpMembers.includes(user.memberId)));

                  return (
                    <tr key={evt.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-bold text-darkblue">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{evt.name}</span>
                          {evt.isSignUpEvent && (
                            <span className="px-1.5 py-0.5 bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                              Sign Up Event
                            </span>
                          )}
                          {evt.requiredCities && evt.requiredCities.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-md flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {evt.requiredCities.join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-normal mt-0.5">{evt.eventType}</div>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        <div><span className="font-semibold">From:</span> {formatDateTimeDDMMMYYYY(evt.fromDateTime)}</div>
                        <div className="text-[11px] text-gray-500"><span className="font-semibold">To:</span> {formatDateTimeDDMMMYYYY(evt.toDateTime)}</div>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {evt.location}
                      </td>

                      <td className="px-4 py-3">
                        {record ? (
                          <div className="space-y-1">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              record?.status === 'Attended' ? 'bg-emerald-100 text-emerald-800' :
                              record?.status === 'Excused' ? 'bg-blue-100 text-blue-800' :
                              record?.status === 'Unable To Attend' ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {record?.status === 'Attended' && (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  {isSignedUp && (
                                    <span className="w-2 h-2 rounded-full bg-pink-500 ring-1 ring-pink-300 shrink-0 inline-block shadow-2xs" title="Signed Up Member" />
                                  )}
                                </>
                              )}
                              <span>{record?.status || 'Pending'}</span>
                            </span>
                            {isAttended ? (
                              <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                <span>✓</span>
                                {isSignedUp && (
                                  <span className="w-2 h-2 rounded-full bg-pink-500 ring-1 ring-pink-300 shrink-0 inline-block" title="Signed Up Member" />
                                )}
                                <span>Verified {isSignedUp ? '(Signed Up Crew)' : '(No reason needed)'}</span>
                              </div>
                            ) : record.excuseReason ? (
                              <div className="text-[11px] text-gray-500 italic max-w-xs truncate">
                                Excuse: "{record.excuseReason}"
                              </div>
                            ) : null}
                          </div>
                        ) : isExempt ? (
                          <div className="space-y-0.5">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              evaluation.isSuspended ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700'
                            }`}>
                              <span>{evaluation.isSuspended ? 'Voluntarily Suspended' : 'Location Exempt'}</span>
                            </span>
                            <div className="text-[10px] text-gray-500">
                              {evaluation.reason}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not Recorded</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isAttended ? (
                          <span className="inline-flex items-center space-x-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md font-bold text-[10px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {isSignedUp && (
                              <span className="w-2 h-2 rounded-full bg-pink-500 ring-1 ring-pink-300 shrink-0 inline-block shadow-2xs" title="Signed Up Member" />
                            )}
                            <span>Attended</span>
                          </span>
                        ) : isExempt ? (
                          <span className="inline-flex items-center space-x-1 text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            <Info className="w-3 h-3 text-gray-500" />
                            <span>Exempt / Optional</span>
                          </span>
                        ) : locked ? (
                          <span className="inline-flex items-center space-x-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            <Lock className="w-3 h-3" />
                            <span>Locked (&gt;48h finish)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            <Clock className="w-3 h-3" />
                            <span>Open (≤48h finish)</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {isAttended ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center space-x-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isSignedUp && (
                                <span className="w-2 h-2 rounded-full bg-pink-500 ring-1 ring-pink-300 shrink-0 inline-block shadow-2xs" title="Signed Up Member" />
                              )}
                              <span>Attended</span>
                            </span>
                            <span className="text-[10px] text-gray-400 mt-1">
                              {isSignedUp ? 'Signed up member' : 'Absence not applicable'}
                            </span>
                          </div>
                        ) : isExempt ? (
                          <span className="text-gray-400 text-[11px] italic">Attendance Exempt</span>
                        ) : !locked ? (
                          <button
                            onClick={() => setSelectedEvent(evt)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-2xs"
                          >
                            Submit Absence Excuse
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">Absence Locked</span>
                        )}

                        {isSecretary && record && (
                          <button
                            onClick={() => {
                              setAdminRecordToEdit(record);
                              setAdminNewStatus((record.status || 'Attended') as any);
                            }}
                            className="ml-2 px-2.5 py-1 bg-darkblue text-white rounded-lg text-xs font-bold"
                          >
                            Admin Override
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Excuse Submission Modal */}
      {selectedEvent && (() => {
        const selectedEventRecord = attendanceRecords.find(a => a.eventId === selectedEvent.id);
        const isEventAttended = selectedEventRecord?.status === 'Attended';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-amber-200 max-w-md w-full p-6">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-base font-bold text-darkblue">Submit Absence Excuse</h3>
                <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-600 mb-2">
                Event: <strong className="text-darkblue">{selectedEvent.name}</strong>
              </p>
              <p className="text-[11px] text-gray-500 mb-4">
                Finish Time: <strong>{formatDateTimeDDMMMYYYY(selectedEvent.toDateTime)}</strong> (Deadline: 48 hours post-finish)
              </p>

              {isEventAttended ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">Attendance Already Confirmed</h4>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        You have already been marked as <strong>Attended</strong> for this event. Absence excuses cannot be submitted after attendance has been recorded and verified.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(null)}
                      className="px-5 py-2 bg-darkblue text-white rounded-xl text-xs font-bold hover:bg-blue-900"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                    <strong>Notice:</strong> If you attended this event in person, no reason is needed. You only need to fill this form if you were unable to attend.
                  </div>

                  <form onSubmit={handleSubmitExcuse} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Reason for Absence *
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Provide detailed reason (e.g., University exams, illness/medical, official travel)..."
                        value={excuseReason}
                        onChange={(e) => setExcuseReason(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon"
                      />
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-900 leading-normal border border-amber-200">
                      Absence excuses submitted within 48 hours of event finish time are routed to the Arabiyya Rover Council for verification.
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(null)}
                        className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingExcuse || !excuseReason.trim()}
                        className="px-5 py-2 bg-maroon text-white rounded-xl text-xs font-bold hover:bg-[#660000]"
                      >
                        {submittingExcuse ? 'Submitting...' : 'Submit Excuse Reason'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Admin Status Override Modal */}
      {adminRecordToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-darkblue max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-darkblue mb-3">Admin Status Override</h3>
            <p className="text-xs text-gray-600 mb-4">
              Member: <strong>{adminRecordToEdit.memberName}</strong>
            </p>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-bold text-gray-700 uppercase">Select Final Status:</label>
              {(['Attended', 'Excused', 'Unable To Attend', 'Not Required'] as const).map(st => (
                <label key={st} className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-gray-800">
                  <input
                    type="radio"
                    name="adminStatus"
                    value={st}
                    checked={adminNewStatus === st}
                    onChange={() => setAdminNewStatus(st)}
                    className="text-maroon focus:ring-maroon"
                  />
                  <span>{st}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setAdminRecordToEdit(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminUpdateStatus}
                className="px-5 py-2 bg-darkblue text-white rounded-xl text-xs font-bold"
              >
                Update Record
              </button>
            </div>
          </div>
        </div>
      )}

      {isSecretary && (
        <div className="pt-6 border-t border-gray-200">
          <MarkAttendanceSection />
        </div>
      )}
    </div>
  );
};
