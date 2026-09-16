import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { safeStorage } from '../utils/safeStorage';
import { calculateTimeRemainingForAward } from '../utils/awardTimeline';
import { formatDateDDMMMYYYY, formatDateTimeDDMMMYYYY } from '../utils/dateUtils';
import { 
  Award, 
  Calendar, 
  Compass, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Bell, 
  Sparkles, 
  AlertCircle, 
  X,
  MapPin,
  Users,
  Tag,
  ChevronRight
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [membersCount, setMembersCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [userAttendance, setUserAttendance] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policiesList, setPoliciesList] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  const [dailyDuties, setDailyDuties] = useState<{ [key: string]: boolean }>(() => {
    const saved = user?.id ? safeStorage.getItem(`arabiyya_daily_duties_${user.id}`) : null;
    return saved ? JSON.parse(saved) : {
      goodTurn: false,
      promiseReflect: false,
      communityService: false,
      envScouting: false,
      selfDiscipline: false
    };
  });

  const [activePromiseTab, setActivePromiseTab] = useState<'promise' | 'laws' | 'motto'>('promise');

  const isSecretary = user?.role === 'Secretary';

  const toggleDuty = (key: string) => {
    const updated = { ...dailyDuties, [key]: !dailyDuties[key] };
    setDailyDuties(updated);
    if (user?.id) {
      safeStorage.setItem(`arabiyya_daily_duties_${user.id}`, JSON.stringify(updated));
    }
  };

  useEffect(() => {
    const annUrl = user?.id ? `/api/announcements?memberId=${user.id}` : '/api/announcements';
    const eventsUrl = `/api/events?isSecretary=${isSecretary ? 'true' : 'false'}`;
    Promise.all([
      fetch(eventsUrl).then(res => res.json()).catch(() => []),
      fetch(annUrl).then(res => res.json()).catch(() => [])
    ]).then(([eventsData, annData]) => {
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setAnnouncements(Array.isArray(annData) ? annData : []);
      setLoadingEvents(false);
    }).catch(() => setLoadingEvents(false));
  }, [user, isSecretary]);

  useEffect(() => {
    if (!user) return;

    // Fetch full member profile for up-to-date dob and award goal details
    fetch(`/api/members/profile?idCardNumber=${encodeURIComponent(user.idCardNumber || '')}&memberId=${encodeURIComponent(user.id || '')}&username=${encodeURIComponent(user.username || '')}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setUserProfile(data);
        }
      })
      .catch(() => {});

    // Always fetch personal attendance records for the current user
    fetch(`/api/attendance?memberId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUserAttendance(data);
      })
      .catch(() => {});

    if (isSecretary) {
      fetch('/api/admin/requests')
        .then(res => res.json())
        .then(data => {
          const joinCount = Array.isArray(data?.joinRequests) ? data.joinRequests.filter((r: any) => r && (r.status === 'Pending Review' || r.status === 'Interview' || r.status === 'Investiture' || r.status === 'Processing' || r.status === 'Interview & Investiture')).length : 0;
          const profileCount = Array.isArray(data?.profileRequests) ? data.profileRequests.filter((r: any) => r && r.status === 'Pending').length : 0;
          const absenceCount = Array.isArray(data?.absenceExcuses) ? data.absenceExcuses.filter((r: any) => r && r.excuseStatus === 'Pending Review').length : 0;
          setPendingRequestsCount(joinCount + profileCount + absenceCount);
        })
        .catch(() => {});
    }
  }, [user, isSecretary]);

  useEffect(() => {
    if (isPolicyModalOpen) {
      setLoadingPolicies(true);
      fetch('/api/policies')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.policies)) {
            setPoliciesList(data.policies);
          }
        })
        .catch(err => console.error('Error fetching policies for modal:', err))
        .finally(() => setLoadingPolicies(false));
    }
  }, [isPolicyModalOpen]);

  // Compute Current User's Personal Attendance across all events
  const myPersonalAttendance = React.useMemo(() => {
    if (!user) {
      return { totalEvents: 0, attended: 0, excused: 0, absent: 0, upcoming: 0, totalConcluded: 0, rateWithoutExcused: 100, rateWithExcused: 100 };
    }

    const applicableEvents = events.filter(evt => {
      if (!evt.membersRequired || evt.membersRequired === 'All' || evt.membersRequired.length === 0) return true;
      if (Array.isArray(evt.membersRequired)) return evt.membersRequired.includes(user.id);
      return false;
    });

    const totalEvents = applicableEvents.length;
    let attended = 0;
    let excused = 0;
    let absent = 0;
    let upcoming = 0;
    const now = Date.now();

    applicableEvents.forEach(evt => {
      const rec = userAttendance.find(a => a.eventId === evt.id);
      const isPast = evt.toDateTime ? new Date(evt.toDateTime).getTime() < now : false;

      if (rec?.status === 'Attended') {
        attended++;
      } else if (rec?.status === 'Excused' || rec?.excuseStatus === 'Approved') {
        excused++;
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
      totalEvents,
      attended,
      excused,
      absent,
      upcoming,
      totalConcluded,
      rateWithoutExcused,
      rateWithExcused
    };
  }, [events, userAttendance, user]);

  if (!user) return null;

  // Sort events so closest upcoming event is on top
  const nowMs = Date.now();
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.fromDateTime ? new Date(a.fromDateTime).getTime() : 0;
    const timeB = b.fromDateTime ? new Date(b.fromDateTime).getTime() : 0;
    const diffA = timeA - nowMs;
    const diffB = timeB - nowMs;
    
    if (diffA >= 0 && diffB >= 0) return diffA - diffB; // Closest upcoming first
    if (diffA >= 0 && diffB < 0) return -1;             // Upcoming before past
    if (diffA < 0 && diffB >= 0) return 1;
    return diffB - diffA;                               // Past events, most recent past first
  });

  const formatEventDateTime = (from?: string, to?: string) => {
    if (!from) return 'Date & Time TBD';
    try {
      const dateStr = formatDateDDMMMYYYY(from);
      const fromTimeStr = formatDateTimeDDMMMYYYY(from).split(', ')[1] || '';
      if (to) {
        const toTimeStr = formatDateTimeDDMMMYYYY(to).split(', ')[1] || '';
        return `${dateStr}${fromTimeStr ? ` • ${fromTimeStr}` : ''}${toTimeStr ? ` – ${toTimeStr}` : ''}`;
      }
      return `${dateStr}${fromTimeStr ? ` • ${fromTimeStr}` : ''}`;
    } catch {
      return formatDateDDMMMYYYY(from);
    }
  };

  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case 'Camp':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Training / Workshop':
      case 'Training':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Ceremony':
      case 'Investiture':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Community Service':
        return 'bg-red-50 text-maroon border-red-200';
      default:
        return 'bg-sky-50 text-darkblue border-sky-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="bg-darkblue rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user.commonName || user.fullName}!
            </h1>
            {isSecretary ? (
              <p className="text-xs sm:text-sm text-amber-200 font-bold mt-1 max-w-xl">
                Rover (Council Secretary)
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
                Arabiyya Members • Member ID Card: <strong className="font-mono text-white">{user.idCardNumber}</strong>
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20">
            <div className="p-2 bg-maroon rounded-lg text-white">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">Section:</div>
              <div className="text-base font-bold text-white">{user.role}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout: Published Events & Announcements Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Published Events) */}
        <div className="lg:col-span-2">
          {/* Published Events Section */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 h-full flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-gray-100 gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-red-50 text-maroon rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-darkblue">Published Events</h2>
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                        {sortedEvents.length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Scheduled events and group activities from Our Events</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('/events')}
                  className="text-xs font-bold text-maroon hover:text-[#660000] transition-colors flex items-center space-x-1.5 self-start sm:self-auto px-3 py-1.5 bg-red-50/60 hover:bg-red-50 rounded-xl"
                >
                  <span>View in Our Events</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {loadingEvents ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-maroon mb-2"></div>
                  <p>Loading published events...</p>
                </div>
              ) : sortedEvents.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200">
                  <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-bold text-sm text-darkblue mb-1">No Published Events Available</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    There are no scheduled events visible at this moment. Check back later or visit the Our Events section.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedEvents.slice(0, 4).map((evt, idx) => {
                    const isClosest = idx === 0;
                    const isUpcoming = evt.fromDateTime ? new Date(evt.fromDateTime).getTime() > nowMs : false;
                    return (
                      <div 
                        key={evt.id} 
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                          isClosest 
                            ? 'border-maroon/30 bg-gradient-to-br from-red-50/30 to-amber-50/20 shadow-xs ring-1 ring-maroon/20' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          {/* Badges & Date */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(evt.eventType)}`}>
                                {evt.eventType || 'Scout Activity'}
                              </span>
                              {isClosest && isUpcoming && (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 bg-maroon text-white rounded-full uppercase tracking-wider">
                                  Closest
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-gray-500 flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>{formatEventDateTime(evt.fromDateTime, evt.toDateTime)}</span>
                            </span>
                          </div>

                          {/* Title & Description */}
                          <h3 className="font-bold text-darkblue text-base mb-1.5 leading-snug line-clamp-2">
                            {evt.name}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                            {evt.description || 'No description provided.'}
                          </p>

                          {/* Metadata Rows */}
                          <div className="space-y-1.5 text-xs text-gray-500 mb-4 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-3.5 h-3.5 text-maroon shrink-0" />
                              <span className="font-medium text-gray-700 truncate">
                                {evt.location || 'Arabiyya Scouting HQ'}
                              </span>
                            </div>
                            {evt.membersRequired && (
                              <div className="flex items-center space-x-2">
                                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="text-[11px] text-gray-600 truncate">
                                  Required: {Array.isArray(evt.membersRequired) ? `${evt.membersRequired.length} Members Designated` : evt.membersRequired}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Action Footer */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => onNavigate('/events')}
                            className="text-xs font-bold text-gray-600 hover:text-darkblue transition-colors flex items-center space-x-1"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onNavigate('/attendance')}
                            className="px-3.5 py-1.5 bg-maroon hover:bg-[#660000] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center space-x-1.5"
                          >
                            <span>My Attendance</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {sortedEvents.length > 4 && (
              <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <button
                  onClick={() => onNavigate('/events')}
                  className="text-xs font-bold text-maroon hover:underline inline-flex items-center space-x-1"
                >
                  <span>View all {sortedEvents.length} scheduled events →</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Announcements Stream & Rover Administration Tools) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-darkblue" />
                  <h2 className="text-base font-bold text-darkblue">Announcements</h2>
                </div>
                <button
                  onClick={() => onNavigate('/announcements')}
                  className="text-xs font-bold text-darkblue hover:underline"
                >
                  View All
                </button>
              </div>

              {loadingEvents ? (
                <div className="text-center py-6 text-gray-500 text-xs">Loading announcements...</div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs font-medium">No recent announcements.</div>
              ) : (
                <div className="space-y-3">
                  {announcements.slice(0, 5).map((ann) => (
                    <div key={ann.id} className="p-3.5 rounded-xl border border-gray-100 hover:border-darkblue transition-all bg-gray-50/50">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                          {ann.category || 'General'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {formatDateDDMMMYYYY(ann.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-bold text-darkblue text-xs mb-1 leading-tight">{ann.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed whitespace-pre-line">{ann.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => onNavigate('/announcements')}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-darkblue text-xs font-bold rounded-xl border border-gray-200 transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>Browse All Announcements</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Secretary / Admin Quick Administration Tools */}
          {isSecretary && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-3xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-bold text-darkblue">Rover Administration Tools</h2>
                </div>
                {pendingRequestsCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
                    {pendingRequestsCount} Pending Review
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => onNavigate('/events')}
                  className="p-3 rounded-xl border border-gray-100 hover:border-maroon hover:bg-red-50/10 transition-all text-left space-y-1.5 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-maroon flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-darkblue">Manage Events</h3>
                  <p className="text-[10px] text-gray-500 leading-normal">Schedule & edit group events.</p>
                </button>

                <button
                  onClick={() => onNavigate('/announcements')}
                  className="p-3 rounded-xl border border-gray-100 hover:border-amber-500 hover:bg-amber-50/10 transition-all text-left space-y-1.5 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-darkblue">Announcements</h3>
                  <p className="text-[10px] text-gray-500 leading-normal">Dispatch broadcasts.</p>
                </button>

                <button
                  onClick={() => onNavigate('/requests')}
                  className="p-3 rounded-xl border border-gray-100 hover:border-sky-500 hover:bg-sky-50/10 transition-all text-left space-y-1.5 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-darkblue">Pending Queue</h3>
                  <p className="text-[10px] text-gray-500 leading-normal">Approve memberships & updates.</p>
                </button>

                <button
                  onClick={() => onNavigate('/meeting-minutes')}
                  className="p-3 rounded-xl border border-gray-100 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all text-left space-y-1.5 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-darkblue">Meeting Minutes</h3>
                  <p className="text-[10px] text-gray-500 leading-normal">Record council decisions.</p>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Member Personal Attendance Summary (for non-secretaries) */}
      {!isSecretary && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-darkblue">Attendance Summary</h2>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  My Attendance Records
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Out of all {myPersonalAttendance.totalEvents} Arabiyya events, here is your personal participation standing.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/attendance')}
              className="px-3.5 py-2 bg-maroon hover:bg-[#660000] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>View Full Attendance Log</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="block text-2xl font-extrabold text-emerald-600">{myPersonalAttendance.attended}</span>
              <span className="text-[11px] uppercase font-bold text-gray-600">Attended</span>
            </div>
            <div className="text-center p-4 bg-amber-50/60 rounded-xl border border-amber-100">
              <span className="block text-2xl font-extrabold text-amber-600">{myPersonalAttendance.excused}</span>
              <span className="text-[11px] uppercase font-bold text-gray-600">Excused</span>
            </div>
            <div className="text-center p-4 bg-red-50/60 rounded-xl border border-red-100">
              <span className="block text-2xl font-extrabold text-maroon">{myPersonalAttendance.absent}</span>
              <span className="text-[11px] uppercase font-bold text-gray-600">Absent</span>
            </div>
            <div className="text-center p-4 bg-sky-50/60 rounded-xl border border-sky-100">
              <span className="block text-2xl font-extrabold text-sky-600">{myPersonalAttendance.upcoming}</span>
              <span className="text-[11px] uppercase font-bold text-gray-600">Upcoming</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-gray-500 font-medium">Overall Attendance Rate (with Excused): </span>
                <strong className="text-emerald-700 font-bold">{myPersonalAttendance.rateWithExcused}%</strong>
              </div>
              <div className="hidden md:block text-gray-300">•</div>
              <div className="hidden md:block">
                <span className="text-gray-500 font-medium">Without Excused: </span>
                <strong className="text-darkblue font-bold">{myPersonalAttendance.rateWithoutExcused}%</strong>
              </div>
            </div>
            <div className="text-gray-500 text-[11px]">
              {myPersonalAttendance.totalConcluded} past concluded events • {myPersonalAttendance.upcoming} scheduled
            </div>
          </div>
        </div>
      )}

      {/* Progression & Award Goal Overview Cards (Hidden for Secretary) */}
      {!isSecretary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Award Goal Tracker */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full">
                  Award Goal
                </span>
              </div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Pursuing Badge
              </h3>
              <p className="text-lg font-bold text-darkblue">
                {userProfile?.awardGoal || user.awardGoal || 'Scouting Exploration'}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Goal Status: <strong className="text-maroon">{(userProfile?.awardIntent ?? user.awardIntent) ? 'Working Toward Award' : 'Exploring'}</strong>
              </p>
              {(userProfile?.awardIntent ?? user.awardIntent) && (
                <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium space-y-1">
                  <div className="flex items-center space-x-1 font-bold text-maroon">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Time Remaining:</span>
                  </div>
                  <div className="font-bold text-darkblue text-xs leading-relaxed">
                    {calculateTimeRemainingForAward(
                      userProfile?.dob || user.dob,
                      userProfile?.role || user.role,
                      userProfile?.ageYears || user.ageYears,
                      userProfile?.ageMonths || user.ageMonths,
                      userProfile?.ageDays || user.ageDays,
                      userProfile?.awardGoal || user.awardGoal
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => onNavigate('/profile')}
                className="text-xs font-bold text-maroon hover:underline flex items-center space-x-1"
              >
                <span>View Award Progression Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Current Progression Level */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-800 rounded-xl">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-900 rounded-full">
                  Level Standing
                </span>
              </div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Current Level
              </h3>
              <p className="text-lg font-bold text-darkblue">
                {user.currentLevel || 'Square'}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Next Rank: <strong className="text-darkblue">Advanced Scouting Standards</strong>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => onNavigate('/profile')}
                className="text-xs font-bold text-darkblue hover:underline flex items-center space-x-1"
              >
                <span>Request Standing Update</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Investiture & Policy Status */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-full">
                  Invested
                </span>
              </div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Investiture Date
              </h3>
              <p className="text-lg font-bold text-emerald-900">
                {formatDateDDMMMYYYY(user.investitureDate || '2025-01-10')}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Rover Operating Policy: <strong className="text-emerald-700">Agreed & Active</strong>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsPolicyModalOpen(true)}
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center space-x-1"
              >
                <span>Read Rover Operating Policy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Daily Duties Tracker & Scout Oath Reflection (for non-secretaries) */}
      {!isSecretary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Duties Tracker */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-3xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-darkblue">My Daily Rover Duties</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                  {Object.values(dailyDuties).filter(Boolean).length}/5 Completed
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-4 leading-normal">
                Reflect on your Scout alignment daily. Check off each duty as you fulfill it to track your consistent character standing.
              </p>

              <div className="space-y-2.5">
                {[
                  { key: 'goodTurn', label: 'Done my Good Turn for today', desc: 'At least one helpful deed for another person without seeking reward.' },
                  { key: 'promiseReflect', label: 'Reviewed the Scout Promise & Laws', desc: 'Consciously aligned thoughts and actions with the code of honor.' },
                  { key: 'communityService', label: 'Fulfilled the Rover Motto: "Service" (Khidhma)', desc: 'Supported local communities, friends, or family members.' },
                  { key: 'envScouting', label: 'Promoted environmental safety/cleanliness', desc: 'Left any place cleaner than how you found it.' },
                  { key: 'selfDiscipline', label: 'Maintained mental & physical discipline', desc: 'Stretched, read, slept well, or worked out to strengthen yourself.' }
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-start space-x-3 p-3 rounded-xl cursor-pointer border transition-all ${
                      dailyDuties[item.key]
                        ? 'bg-emerald-50/30 border-emerald-200 text-gray-800'
                        : 'bg-white border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={dailyDuties[item.key] || false}
                      onChange={() => toggleDuty(item.key)}
                      className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4.5 h-4.5"
                    />
                    <div className="space-y-0.5">
                      <span className={`text-xs font-bold block ${dailyDuties[item.key] ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {item.label}
                      </span>
                      <p className="text-[10px] text-gray-500 leading-normal">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex-1 max-w-xs mr-4">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                  <span>Duty Fulfillment</span>
                  <span>{Math.round((Object.values(dailyDuties).filter(Boolean).length / 5) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((Object.values(dailyDuties).filter(Boolean).length / 5) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-gray-400 italic">Resets at midnight local time</span>
            </div>
          </div>

          {/* Promise and Law Reflection Tab */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-3xs flex flex-col justify-between">
            <div>
              {/* Tab Selector */}
              <div className="flex bg-gray-100 p-1 rounded-xl gap-1 mb-4">
                {['promise', 'laws', 'motto'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActivePromiseTab(tab as any)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                      activePromiseTab === tab
                        ? 'bg-white text-darkblue shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activePromiseTab === 'promise' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold text-darkblue uppercase tracking-wider">The Scout Promise</h4>
                  <p className="text-xs text-gray-700 italic leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    "On my honour I promise that I will do my best,<br />
                    To do my duty to Allah, and country,<br />
                    To help other people at all times,<br />
                    And to obey the Scout Law."
                  </p>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    As Arabiyya Rovers, we hold this oath of duty close to our daily endeavors and service networks.
                  </p>
                </div>
              )}

              {activePromiseTab === 'laws' && (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold text-darkblue uppercase tracking-wider mb-1">The 10 Scout Laws</h4>
                  {[
                    'A Scout is to be trusted.',
                    'A Scout is loyal.',
                    'A Scout is friendly and considerate.',
                    'A Scout is a brother to all Scouts.',
                    'A Scout has courage in all difficulties.',
                    'A Scout makes good use of time and resources.',
                    'A Scout has respect for self and others.',
                    'A Scout is clean in thought, word, and deed.'
                  ].map((law, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-gray-700 border-b border-gray-50 pb-1.5">
                      <span className="font-bold text-maroon text-[10px] bg-red-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-normal font-semibold">{law}</span>
                    </div>
                  ))}
                </div>
              )}

              {activePromiseTab === 'motto' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold text-darkblue uppercase tracking-wider">The Rover Motto</h4>
                  <div className="text-center p-4 bg-maroon/5 rounded-xl border border-maroon/10">
                    <span className="text-lg font-black text-maroon tracking-wider uppercase block font-serif">
                      "SERVICE"
                    </span>
                    <span className="text-xs font-bold text-darkblue italic block mt-1">
                      (Al-Khidhma / الخدمة)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    A Rover Scout is a citizen who seeks to become a useful member of society by actively performing service without expectation of material returns.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => onNavigate('/policy')}
                className="w-full py-2 bg-darkblue hover:bg-opacity-95 text-white text-xs font-bold rounded-xl shadow-2xs text-center transition-colors flex items-center justify-center space-x-2"
              >
                <span>Read Full Operational Guidelines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Modal Popup */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col relative">
            <div className="p-6 bg-darkblue text-white rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider">Reference Document</span>
                <h3 className="text-lg font-bold">Rover Operating Policy</h3>
              </div>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="p-2 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-gray-700">
              {loadingPolicies ? (
                <div className="py-12 text-center text-gray-400 font-medium">
                  Loading Rover Operating Policy...
                </div>
              ) : policiesList.length === 0 ? (
                <div className="py-12 text-center text-gray-500 font-medium space-y-2">
                  <p>No active policy clauses found.</p>
                  <p className="text-[11px] text-gray-400">Policy clauses can be managed from the Policy page.</p>
                </div>
              ) : (
                policiesList.map((policy) => (
                  <div key={policy.id || policy.number} className="space-y-2 bg-gray-50/80 border border-gray-200 p-4 rounded-2xl">
                    <h4 className="font-bold text-darkblue text-sm flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-darkblue text-white text-[10px] font-mono rounded-md">{policy.number}</span>
                      <span>{policy.title}</span>
                    </h4>
                    <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {policy.content}
                    </div>
                    {policy.imageUrl && (
                      <div className="pt-2">
                        <img
                          src={policy.imageUrl}
                          alt={policy.imageCaption || policy.title}
                          className="max-h-60 max-w-full rounded-xl border border-gray-200 object-cover shadow-2xs"
                        />
                        {policy.imageCaption && (
                          <p className="text-[11px] text-gray-500 italic mt-1">{policy.imageCaption}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-3xl flex justify-between items-center">
              <button
                onClick={() => {
                  setIsPolicyModalOpen(false);
                  onNavigate('/policy');
                }}
                className="text-xs font-bold text-maroon hover:underline"
              >
                Open Full Policy Page →
              </button>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="px-5 py-2 bg-darkblue text-white font-bold text-xs rounded-xl hover:bg-blue-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
