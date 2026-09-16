import React, { useState, useEffect } from 'react';
import { formatDateDDMMMYYYY } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { EventItem, MeetingMinute } from '../types';
import { WordRichTextEditor } from '../components/WordRichTextEditor';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Search, 
  User, 
  X, 
  Send, 
  Lock, 
  Sparkles, 
  ChevronRight,
  ShieldAlert,
  ListOrdered,
  CheckSquare,
  Building,
  Info
} from 'lucide-react';

interface MeetingMinutesPageProps {
  onNavigate: (path: string) => void;
}

export const MeetingMinutesPage: React.FC<MeetingMinutesPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isSecretary = user?.role === 'Secretary';

  const [events, setEvents] = useState<EventItem[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);

  // New Minute Form State
  const [formEventId, setFormEventId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAgenda, setFormAgenda] = useState('');
  const [formDiscussion, setFormDiscussion] = useState('');
  const [formResolutions, setFormResolutions] = useState('');
  const [formActionItems, setFormActionItems] = useState('');
  const [formNextDate, setFormNextDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [evtsRes, minRes] = await Promise.all([
        fetch('/api/events?isSecretary=true').then(r => r.json()),
        fetch('/api/meeting-minutes').then(r => r.json())
      ]);

      const loadedEvts: EventItem[] = Array.isArray(evtsRes) ? evtsRes : [];
      const loadedMin: MeetingMinute[] = Array.isArray(minRes) ? minRes : [];

      setEvents(loadedEvts);
      setMinutes(loadedMin);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Filter events classified as Meetings (eventType contains Meeting, Council, Assembly, Court, or selected explicitly)
  const meetingEvents = events.filter(e => {
    const typeLower = (e.eventType || '').toLowerCase();
    const nameLower = (e.name || '').toLowerCase();
    return (
      typeLower.includes('meeting') || 
      typeLower.includes('council') || 
      typeLower.includes('assembly') || 
      typeLower.includes('court') || 
      nameLower.includes('meeting') ||
      nameLower.includes('council') ||
      nameLower.includes('assembly')
    );
  });

  // Handle Event selection in creation form to auto-populate Title & Date
  const handleEventSelect = (eventId: string) => {
    setFormEventId(eventId);
    const evt = events.find(e => e.id === eventId);
    if (evt) {
      setFormTitle(`Minutes of ${evt.name}`);
    }
  };

  const handleCreateMinutes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEventId || !formTitle.trim() || !formDiscussion.trim()) {
      setErrorMsg('Event, Title, and Discussion Points are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/meeting-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: formEventId,
          title: formTitle,
          agenda: formAgenda,
          discussionPoints: formDiscussion,
          resolutions: formResolutions,
          actionItems: formActionItems,
          nextMeetingDate: formNextDate,
          publishedBy: user?.fullName || 'Secretary of Arabiyya Rover Network'
        })
      });

      const data = await res.json();
      setSubmitting(false);

      if (res.ok) {
        setShowCreateModal(false);
        // Reset form
        setFormEventId('');
        setFormTitle('');
        setFormAgenda('');
        setFormDiscussion('');
        setFormResolutions('');
        setFormActionItems('');
        setFormNextDate('');
        loadData();
      } else {
        setErrorMsg(data.error || 'Failed to publish meeting minutes.');
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMsg('Server error publishing minutes.');
    }
  };

  const filteredMinutes = minutes.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.title.toLowerCase().includes(term) ||
      m.eventName.toLowerCase().includes(term) ||
      m.discussionPoints.toLowerCase().includes(term) ||
      m.publishedBy.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-maroon font-bold text-xs uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Arabiyya Group Records</span>
          </div>
          <h1 className="text-2xl font-bold text-darkblue">Official Meeting Minutes</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Published meeting minutes and deliberations for Arabiyya Rover Council & Group Assemblies.
          </p>
        </div>
      </div>

      {/* Info Callout Box regarding Event Classification Rule */}
      <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-darkblue text-xs flex items-start space-x-3">
        <Info className="w-5 h-5 text-maroon shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold">Event Classification Rule:</strong> Meeting minutes are required and published per event classified as a <strong className="text-maroon">Meeting</strong> (e.g., General Assemblies, Executive Meetings, Rover Council Meetings). Other event categories (such as Camps, Expeditions, Workshops, Drills) proceed without meeting minutes.
        </div>
      </div>

      {/* Control Bar: Search & Secretary Action Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search meeting minutes by title, agenda, or resolution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl bg-white shadow-2xs focus:border-maroon focus:ring-1 focus:ring-maroon"
          />
        </div>

        {isSecretary && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-maroon hover:bg-[#660000] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Publish Meeting Minutes</span>
          </button>
        )}
      </div>

      {/* Meeting Minutes Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400">Loading meeting minutes...</div>
      ) : filteredMinutes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 space-y-3">
          <FileText className="w-10 h-10 text-gray-300 mx-auto" />
          <div className="text-sm font-bold text-darkblue">No Published Meeting Minutes</div>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchTerm ? 'No results match your search query.' : 'No official meeting minutes have been published yet. Meeting minutes will appear here once published by the Secretary.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMinutes.map((min) => (
            <div
              key={min.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs hover:border-maroon transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                    Official Minutes
                  </span>
                  <span className="text-xs text-gray-400 font-mono flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>{formatDateDDMMMYYYY(min.eventDate || min.publishedAt)}</span>
                  </span>
                </div>

                <h3 className="font-bold text-darkblue text-base">{min.title}</h3>
                <div className="text-xs text-maroon font-semibold flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>{min.eventName}</span>
                </div>

                {min.agenda && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong className="font-bold text-gray-700">Agenda:</strong> {min.agenda}
                  </div>
                )}

                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-line">
                  {min.discussionPoints}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span className="text-[11px]">Dispatched by <strong>{min.publishedBy}</strong></span>
                <button
                  onClick={() => setSelectedMinute(min)}
                  className="font-bold text-maroon hover:underline flex items-center space-x-1"
                >
                  <span>Read Full Minutes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MEETING MINUTES MODAL (SECRETARY ONLY) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-2 text-darkblue font-bold text-base">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Create & Publish Meeting Minutes</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs font-bold rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateMinutes} className="space-y-4 text-xs">
              
              {/* Event Selection */}
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Select Meeting Event <span className="text-red-500">*</span>
                </label>
                <select
                  value={formEventId}
                  onChange={(e) => handleEventSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium focus:border-maroon focus:ring-1 focus:ring-maroon"
                  required
                >
                  <option value="">-- Choose Event --</option>
                  {events.map(evt => (
                    <option key={evt.id} value={evt.id}>
                      {evt.name} ({evt.eventType}) - {evt.fromDateTime ? formatDateDDMMMYYYY(evt.fromDateTime) : 'TBD'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Note: Publishing minutes for an event automatically locks attendance marking for that event.
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Meeting Minutes Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Minutes of Arabiyya Rover Council Meeting #14"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold text-darkblue"
                  required
                />
              </div>

              {/* Agenda */}
              <WordRichTextEditor
                label="Meeting Agenda"
                value={formAgenda}
                onChange={setFormAgenda}
                placeholder="Type or format meeting agenda items..."
                minHeight="100px"
              />

              {/* Discussion Points */}
              <WordRichTextEditor
                label="Discussion Points & Deliberations"
                value={formDiscussion}
                onChange={setFormDiscussion}
                placeholder="Detailed summary of proceedings, topics discussed, and council deliberations..."
                minHeight="200px"
                required
              />

              {/* Resolutions */}
              <WordRichTextEditor
                label="Passed Resolutions & Decisions"
                value={formResolutions}
                onChange={setFormResolutions}
                placeholder="Official decisions and resolutions approved during the meeting..."
                minHeight="120px"
              />

              {/* Action Items */}
              <WordRichTextEditor
                label="Action Items & Assignments"
                value={formActionItems}
                onChange={setFormActionItems}
                placeholder="Assigned tasks, responsible leads, and deadlines..."
                minHeight="120px"
              />

              {/* Next Meeting Date */}
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Next Meeting Date (Optional)</label>
                <input
                  type="date"
                  value={formNextDate}
                  onChange={(e) => setFormNextDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-maroon hover:bg-[#660000] text-white font-bold rounded-xl shadow-xs flex items-center space-x-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Publishing...' : 'Publish Meeting Minutes'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FULL READ MODAL (Microsoft Word Document Styled Canvas) */}
      {selectedMinute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-3xl w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex justify-between items-start pb-4 border-b border-gray-200">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-200 uppercase tracking-wider">
                  Official Meeting Record
                </span>
                <h2 className="text-2xl font-bold text-darkblue mt-2">{selectedMinute.title}</h2>
                <div className="text-xs text-maroon font-semibold mt-1 flex items-center space-x-3">
                  <span>Event: {selectedMinute.eventName}</span>
                  <span>•</span>
                  <span>Date: {formatDateDDMMMYYYY(selectedMinute.eventDate)}</span>
                </div>
              </div>
              <button onClick={() => setSelectedMinute(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Body - Styled as Word Sheet */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200 space-y-6 text-xs text-gray-800">
              
              {selectedMinute.agenda && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                  <strong className="font-bold text-darkblue uppercase tracking-wider text-xs block border-b border-gray-100 pb-1">
                    Meeting Agenda
                  </strong>
                  <div 
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: selectedMinute.agenda }} 
                  />
                </div>
              )}

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                <strong className="font-bold text-darkblue uppercase tracking-wider text-xs block border-b border-gray-100 pb-1.5">
                  Discussion Points & Deliberations
                </strong>
                <div 
                  className="prose prose-sm max-w-none text-gray-800 leading-relaxed font-sans pt-1"
                  dangerouslySetInnerHTML={{ __html: selectedMinute.discussionPoints }} 
                />
              </div>

              {selectedMinute.resolutions && (
                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                  <strong className="font-bold text-emerald-900 uppercase tracking-wider text-xs block border-b border-emerald-200/60 pb-1">
                    Passed Resolutions & Decisions
                  </strong>
                  <div 
                    className="prose prose-sm max-w-none text-emerald-950 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: selectedMinute.resolutions }} 
                  />
                </div>
              )}

              {selectedMinute.actionItems && (
                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-2xs space-y-2">
                  <strong className="font-bold text-darkblue uppercase tracking-wider text-xs block border-b border-blue-200/60 pb-1">
                    Action Items & Assignments
                  </strong>
                  <div 
                    className="prose prose-sm max-w-none text-gray-900 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: selectedMinute.actionItems }} 
                  />
                </div>
              )}

              {selectedMinute.nextMeetingDate && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-900 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  <span>Next Scheduled Meeting: <strong>{formatDateDDMMMYYYY(selectedMinute.nextMeetingDate)}</strong></span>
                </div>
              )}

            </div>

            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
              <span>Published by <strong>{selectedMinute.publishedBy}</strong> on {selectedMinute.publishedAt?.split('T')[0]}</span>
              <button
                onClick={() => setSelectedMinute(null)}
                className="px-5 py-2 bg-darkblue hover:bg-blue-900 text-white font-bold rounded-xl transition-colors shadow-2xs"
              >
                Close Document
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
