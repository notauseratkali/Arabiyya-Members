import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogoImage } from '../components/LogoImage';
import { EventItem } from '../types';
import { Calendar, Plus, Trash2, Send, Bell, MapPin, Clock, CheckCircle2, ShieldAlert, Users, Filter, X, Lock, LogIn, AlertCircle, Pencil, Building2, Check, CheckSquare, Square, Info } from 'lucide-react';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import {
  getMemberCurrentCity,
  isMemberVoluntarilySuspended,
  getUniqueMemberCitiesWithCounts,
  evaluateEventRequirementForMember
} from '../utils/memberHelpers';

interface EventsPageProps {
  onNavigate: (path: string) => void;
}

const getMemberCity = (m: any): string => {
  return getMemberCurrentCity(m);
};

const getNowLocalDateTime = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const EventsPage: React.FC<EventsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isSecretary = user?.role === 'Secretary';

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [eventPendingDelete, setEventPendingDelete] = useState<EventItem | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // Admin Event Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [fromDateTime, setFromDateTime] = useState('');
  const [toDateTime, setToDateTime] = useState('');
  const [eventType, setEventType] = useState('Scout Gathering');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [requirementMode, setRequirementMode] = useState<'All' | 'LocationBased' | 'Specific'>('All');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [membersRequired, setMembersRequired] = useState<string[]>([]);
  const [notificationType, setNotificationType] = useState<'Email' | 'Telegram'>('Email');
  const [publishDateTime, setPublishDateTime] = useState(getNowLocalDateTime());
  const [isSignUpEvent, setIsSignUpEvent] = useState(false);

  // Admin Event Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventName, setEditEventName] = useState('');
  const [editFromDateTime, setEditFromDateTime] = useState('');
  const [editToDateTime, setEditToDateTime] = useState('');
  const [editEventType, setEditEventType] = useState('Scout Gathering');
  const [editEventLocation, setEditEventLocation] = useState('');
  const [editEventDescription, setEditEventDescription] = useState('');
  const [editRequirementMode, setEditRequirementMode] = useState<'All' | 'LocationBased' | 'Specific'>('All');
  const [editSelectedCities, setEditSelectedCities] = useState<string[]>([]);
  const [editCitySearchQuery, setEditCitySearchQuery] = useState('');
  const [editMembersRequired, setEditMembersRequired] = useState<string[]>([]);
  const [editNotificationType, setEditNotificationType] = useState<'Email' | 'Telegram'>('Email');
  const [editPublishDateTime, setEditPublishDateTime] = useState('');
  const [editNotifyMembers, setEditNotifyMembers] = useState(true);
  const [editMemberSearchQuery, setEditMemberSearchQuery] = useState('');
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editIsSignUpEvent, setEditIsSignUpEvent] = useState(false);
  const [signingUpEventId, setSigningUpEventId] = useState<string | null>(null);

  // Sign-Up Confirmation & Success Modals
  const [confirmSignUpModal, setConfirmSignUpModal] = useState<{ event: EventItem; isSignedUp: boolean } | null>(null);
  const [signUpSuccessModal, setSignUpSuccessModal] = useState<{ title: string; message: string; eventName: string; isSignUp: boolean } | null>(null);

  // Dynamic Event Types Admin Control
  const [eventTypes, setEventTypes] = useState<string[]>([
    'Scout Gathering', 'Rover Camp', 'Leadership Workshop', 'Council Meeting', 'Investiture Ceremony', 'Community Service'
  ]);
  const [newTypeName, setNewTypeName] = useState('');
  const [showManageTypes, setShowManageTypes] = useState(false);

  // Notification Dispatch Preview Modal
  const [dispatchResult, setDispatchResult] = useState<{
    eventName: string;
    notificationType: 'Email' | 'Telegram';
    announcementMessage: string;
    dispatchedTo: string;
  } | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Extract all unique member current address cities with counts
  const memberCitiesList = useMemo(() => {
    return getUniqueMemberCitiesWithCounts(allMembers);
  }, [allMembers]);

  const loadEvents = () => {
    setLoading(true);
    fetch(`/api/events?isSecretary=${isSecretary ? 'true' : 'false'}`)
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadSettings = () => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.event_types) setEventTypes(data.event_types);
      })
      .catch(() => {});
  };

  const loadMembers = () => {
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllMembers(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadEvents();
    loadSettings();
    if (user) {
      loadMembers();
    }
  }, [user]);

  const handleOpenCreateModal = () => {
    setEventName('');
    setFromDateTime('');
    setToDateTime('');
    setEventType(eventTypes[0] || 'Scout Gathering');
    setEventLocation('');
    setEventDescription('');
    setRequirementMode('All');
    setSelectedCities([]);
    setCitySearchQuery('');
    setMembersRequired([]);
    setMemberSearchQuery('');
    setNotificationType('Email');
    setPublishDateTime(getNowLocalDateTime());
    setIsSignUpEvent(false);
    setFormError(null);
    setShowCreateModal(true);
  };

  // Handle Event Creation
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!eventName || !fromDateTime || !toDateTime || !eventLocation || !publishDateTime) {
      setFormError('Please fill in all required event parameters.');
      return;
    }

    if (requirementMode === 'LocationBased' && selectedCities.length === 0) {
      setFormError('Please select at least one city for location-specific event.');
      return;
    }

    if (requirementMode === 'Specific' && membersRequired.length === 0) {
      setFormError('Please select at least one member.');
      return;
    }

    try {
      const finalMembersRequired = requirementMode === 'Specific' ? membersRequired : (requirementMode === 'LocationBased' ? 'LocationBased' : 'All');
      const finalRequiredCities = requirementMode === 'LocationBased' ? selectedCities : [];

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName,
          fromDateTime,
          toDateTime,
          eventType,
          location: eventLocation,
          description: eventDescription,
          membersRequired: finalMembersRequired,
          requiredCities: finalRequiredCities,
          notificationType,
          publishDateTime,
          triggerDateTime: publishDateTime,
          isSignUpEvent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create event.');
        return;
      }

      setShowCreateModal(false);
      setEventName('');
      setEventLocation('');
      setEventDescription('');
      setRequirementMode('All');
      setSelectedCities([]);
      setMembersRequired([]);
      setMemberSearchQuery('');
      setIsSignUpEvent(false);
      loadEvents();
    } catch (err) {
      setFormError('Error creating event.');
    }
  };

  // Handle Open Edit Modal
  const handleOpenEditModal = (evt: EventItem) => {
    setEditingEventId(evt.id);
    setEditEventName(evt.name || '');
    setEditFromDateTime(evt.fromDateTime || '');
    setEditToDateTime(evt.toDateTime || '');
    setEditEventType(evt.eventType || eventTypes[0] || 'Scout Gathering');
    setEditEventLocation(evt.location || '');
    setEditEventDescription(evt.description || '');
    setEditIsSignUpEvent(Boolean(evt.isSignUpEvent));

    if (evt.requiredCities && Array.isArray(evt.requiredCities) && evt.requiredCities.length > 0) {
      setEditRequirementMode('LocationBased');
      setEditSelectedCities(evt.requiredCities);
      setEditMembersRequired([]);
    } else if (Array.isArray(evt.membersRequired)) {
      setEditRequirementMode('Specific');
      setEditMembersRequired(evt.membersRequired);
      setEditSelectedCities([]);
    } else {
      setEditRequirementMode('All');
      setEditSelectedCities([]);
      setEditMembersRequired([]);
    }

    setEditNotificationType(evt.notificationType === 'Telegram' ? 'Telegram' : 'Email');
    setEditPublishDateTime(evt.publishDateTime || evt.triggerDateTime || evt.fromDateTime || getNowLocalDateTime());
    setEditNotifyMembers(true);
    setEditMemberSearchQuery('');
    setEditCitySearchQuery('');
    setEditFormError(null);
    setShowEditModal(true);
  };

  // Handle Save Event Edits
  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventId) return;
    setEditFormError(null);

    if (!editEventName || !editFromDateTime || !editToDateTime || !editEventLocation || !editPublishDateTime) {
      setEditFormError('Please fill in all required event fields.');
      return;
    }

    if (editRequirementMode === 'LocationBased' && editSelectedCities.length === 0) {
      setEditFormError('Please select at least one city for location-specific event.');
      return;
    }

    if (editRequirementMode === 'Specific' && editMembersRequired.length === 0) {
      setEditFormError('Please select at least one member.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const finalMembersRequired = editRequirementMode === 'Specific' ? editMembersRequired : (editRequirementMode === 'LocationBased' ? 'LocationBased' : 'All');
      const finalRequiredCities = editRequirementMode === 'LocationBased' ? editSelectedCities : [];

      const res = await fetch(`/api/events/${editingEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editEventName,
          fromDateTime: editFromDateTime,
          toDateTime: editToDateTime,
          eventType: editEventType,
          location: editEventLocation,
          description: editEventDescription,
          membersRequired: finalMembersRequired,
          requiredCities: finalRequiredCities,
          notificationType: editNotificationType,
          publishDateTime: editPublishDateTime,
          triggerDateTime: editPublishDateTime,
          notifyMembers: editNotifyMembers,
          isSignUpEvent: editIsSignUpEvent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setEditFormError(data.error || 'Failed to update event.');
        setIsSavingEdit(false);
        return;
      }

      setShowEditModal(false);
      setEditingEventId(null);
      loadEvents();
    } catch (err) {
      setEditFormError('Network error while saving changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Event Sign Up / Withdraw Initiation & Confirmation
  const handleInitiateSignUpToggle = (evt: EventItem) => {
    if (!user) return;
    const currentMember = allMembers.find(m => m.id === user.memberId || m.id === user.id || (user.email && m.email === user.email));
    const userMemberIds = [
      currentMember?.id,
      user.id,
      user.memberId,
      ...(allMembers.filter(m => user.email && m.email === user.email).map(m => m.id))
    ].filter(Boolean) as string[];

    const isSignedUp = Boolean(
      Array.isArray(evt.signedUpMembers) &&
      userMemberIds.some(id => evt.signedUpMembers.includes(id))
    );
    setConfirmSignUpModal({ event: evt, isSignedUp });
  };

  const handleConfirmSignUp = async () => {
    if (!confirmSignUpModal || !user) return;
    const { event: evt, isSignedUp } = confirmSignUpModal;
    const currentMember = allMembers.find(m => m.id === user.memberId || m.id === user.id || (user.email && m.email === user.email));
    const memberId = currentMember?.id || user.memberId || user.id;

    if (!memberId) return;

    const eventId = evt.id;
    setSigningUpEventId(eventId);
    setConfirmSignUpModal(null);

    try {
      const res = await fetch(`/api/events/${eventId}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action: 'toggle' })
      });

      if (res.ok) {
        await loadEvents();
        if (!isSignedUp) {
          setSignUpSuccessModal({
            title: 'Sign Up Confirmed! 🎉',
            message: `You have successfully signed up for "${evt.name}". Your response has been recorded for the crew roster.`,
            eventName: evt.name,
            isSignUp: true
          });
        } else {
          setSignUpSuccessModal({
            title: 'Sign-Up Withdrawn',
            message: `Your sign-up for "${evt.name}" has been withdrawn.`,
            eventName: evt.name,
            isSignUp: false
          });
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update sign-up status.');
      }
    } catch (err) {
      console.error('Sign up error', err);
      alert('Network error while processing sign-up.');
    } finally {
      setSigningUpEventId(null);
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = (eventItem: EventItem) => {
    setEventPendingDelete(eventItem);
  };

  const confirmDeleteEvent = async () => {
    if (!eventPendingDelete) return;
    setIsDeletingEvent(true);
    try {
      await fetch(`/api/events/${eventPendingDelete.id}`, { method: 'DELETE' });
      setEventPendingDelete(null);
      loadEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
    } finally {
      setIsDeletingEvent(false);
    }
  };

  // Handle Dispatch Notification Announcement
  const handleDispatchNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/notify`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setDispatchResult({
          eventName: data.announcementMessage.split('\n')[1] || 'Event Announcement',
          notificationType: data.notificationType,
          announcementMessage: data.announcementMessage,
          dispatchedTo: data.dispatchedTo
        });
      }
    } catch (err) {
      alert('Notification dispatch failed.');
    }
  };

  // Dynamic Add Event Type
  const handleAddEventType = async () => {
    if (!newTypeName.trim()) return;
    const updated = [...eventTypes, newTypeName.trim()];
    setEventTypes(updated);
    setNewTypeName('');

    if (isSecretary) {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_types: updated })
      });
    }
  };

  const handleRemoveEventType = async (typeToRemove: string) => {
    const updated = eventTypes.filter(t => t !== typeToRemove);
    setEventTypes(updated);
    setNewTypeName('');

    if (isSecretary) {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_types: updated })
      });
    }
  };

  const filteredEvents = activeCategory === 'All' 
    ? events 
    : events.filter(e => e.eventType === activeCategory);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-blue-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-white border border-sky-100 flex items-center justify-center p-1 mx-auto shadow-xs">
            <LogoImage className="w-full h-full object-contain" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-maroon">Access Restricted</div>
            <h1 className="text-2xl font-bold text-darkblue">Our Events Schedule</h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              The event schedule, gathering details, and training workshops are reserved for registered Arabiyya members only. Please log in to view the schedule.
            </p>
          </div>
          <div className="pt-2 flex flex-col space-y-3">
            <button
              onClick={() => onNavigate('/signin')}
              className="w-full py-3 bg-darkblue hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to View Schedule</span>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-maroon font-bold text-xs uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Arabiyya Rover Group Schedule</span>
          </div>
          <h1 className="text-2xl font-bold text-darkblue">Our Events</h1>
          <p className="text-xs text-gray-500 mt-1">
            Official gathering schedule, camps, training workshops, and ceremonies.
          </p>
        </div>

        {isSecretary && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowManageTypes(!showManageTypes)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Configure Event Types
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-maroon hover:bg-[#660000] text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Event Types Admin Control Drawer */}
      {isSecretary && showManageTypes && (
        <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm animate-in fade-in space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-darkblue">Manage Dynamic Event Types</h3>
            <button onClick={() => setShowManageTypes(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="New Event Type Name"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl"
            />
            <button
              onClick={handleAddEventType}
              className="px-4 py-2 bg-darkblue text-white text-xs font-bold rounded-xl"
            >
              Add Type
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {eventTypes.map((type) => (
              <span key={type} className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800">
                <span>{type}</span>
                <button onClick={() => handleRemoveEventType(type)} className="text-red-600 hover:text-red-800 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeCategory === 'All'
              ? 'bg-sky-50 text-sky-600 border border-sky-300 shadow-2xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          All Categories
        </button>
        {eventTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveCategory(type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeCategory === type
                ? 'bg-sky-50 text-sky-600 border border-sky-300 shadow-2xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-500 text-sm">
          No events scheduled under this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((evt) => {
            const currentUserMember = allMembers.find(m => m.id === user?.memberId || m.id === user?.id || (user?.email && m.email === user?.email));
            const memberEvaluation = user && currentUserMember ? evaluateEventRequirementForMember(evt, currentUserMember) : null;
            const hasLocationReq = evt.requiredCities && Array.isArray(evt.requiredCities) && evt.requiredCities.length > 0;
            const userMemberIds = [
              currentUserMember?.id,
              user?.id,
              user?.memberId,
              ...(allMembers.filter(m => user?.email && m.email === user?.email).map(m => m.id))
            ].filter(Boolean) as string[];
            const isUserSignedUp = Boolean(
              user &&
              Array.isArray(evt.signedUpMembers) &&
              userMemberIds.some(id => evt.signedUpMembers.includes(id))
            );

            return (
              <div key={evt.id} className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 flex flex-col justify-between hover:border-maroon transition-all">
                <div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-3 py-1 bg-blue-50 text-darkblue text-xs font-bold rounded-full border border-blue-100">
                        {evt.eventType}
                      </span>
                      {evt.isSignUpEvent && (
                        <span className="px-2.5 py-1 bg-pink-50 text-pink-800 text-[11px] font-bold rounded-full border border-pink-200 flex items-center gap-1 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                          Open Sign-Up Event
                        </span>
                      )}
                      {hasLocationReq && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-full border border-amber-200 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          Location-Specific
                        </span>
                      )}
                    </div>

                    {isSecretary && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(evt)}
                          title="Edit Event Details"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDispatchNotification(evt)}
                          title="Dispatch Notification Announcement"
                          className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt)}
                          title="Delete Event"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-darkblue mb-2">{evt.name}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    {evt.description || 'No detailed description provided.'}
                  </p>

                  <div className="space-y-2 text-xs text-gray-700 bg-gray-50 p-3.5 rounded-xl mb-4 border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-maroon shrink-0" />
                      <span><strong>From:</strong> {evt.fromDateTime.replace('T', ' ')} • <strong>To:</strong> {evt.toDateTime.replace('T', ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-darkblue shrink-0" />
                      <span><strong>Location:</strong> {evt.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                      <span><strong>Publish Date:</strong> {(evt.publishDateTime || evt.triggerDateTime || evt.fromDateTime).replace('T', ' ')}</span>
                    </div>

                    {/* Requirement Policy Breakdown */}
                    <div className="flex items-start space-x-2 pt-1 border-t border-gray-200/60 mt-2">
                      <Users className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong>Required Policy: </strong>
                        {hasLocationReq ? (
                          <div>
                            <div className="font-semibold text-gray-900 mt-0.5">
                              Required for members residing in: <span className="text-maroon font-bold">{evt.requiredCities?.join(', ')}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              Open & optional for members from other locations (no absence penalty).
                            </div>
                          </div>
                        ) : evt.membersRequired === 'All' || !evt.membersRequired || evt.membersRequired.length === 0 ? (
                          <div className="text-gray-700 font-semibold mt-0.5">
                            All Active Members Required <span className="text-[11px] text-indigo-700 font-normal">(Voluntary suspended members auto-excused)</span>
                          </div>
                        ) : (
                          <div className="text-gray-800 font-semibold leading-relaxed mt-0.5">
                            {Array.isArray(evt.membersRequired) ? (
                              evt.membersRequired
                                .map(id => {
                                  const found = allMembers.find(m => m.id === id);
                                  if (!found) return null;
                                  const city = getMemberCity(found);
                                  return `${found.commonName || found.fullName}${city ? ` (${city})` : ''}`;
                                })
                                .filter(Boolean)
                                .join(', ')
                            ) : (
                              'All Members'
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member's Personal Status Card */}
                    {memberEvaluation && (
                      <div className={`mt-2 p-2.5 rounded-lg border text-xs flex items-start gap-2 ${memberEvaluation.badgeStyle}`}>
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">{memberEvaluation.statusLabel}</div>
                          <div className="text-[11px] opacity-90 mt-0.5">{memberEvaluation.reason}</div>
                        </div>
                      </div>
                    )}

                    {/* Open Sign-Up Crew Action Section */}
                    {evt.isSignUpEvent && (
                      <div className="mt-3 p-3 bg-pink-50/90 border border-pink-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-pink-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0 inline-block" />
                            <span>Open Crew Sign-Up</span>
                          </div>
                          <div className="text-[11px] text-pink-800 mt-0.5">
                            {Array.isArray(evt.signedUpMembers) && evt.signedUpMembers.length > 0 ? (
                              <span>
                                <strong>{evt.signedUpMembers.length}</strong> crew member(s) signed up
                                {Array.isArray(evt.signedUpMembers) && evt.signedUpMembers.length > 0 && (
                                  <span className="block text-[10px] text-pink-700 font-normal mt-0.5">
                                    Signed up: {evt.signedUpMembers.map(mId => {
                                      const m = allMembers.find(mem => mem.id === mId);
                                      return m ? (m.commonName || m.fullName) : null;
                                    }).filter(Boolean).join(', ')}
                                  </span>
                                )}
                              </span>
                            ) : (
                              'Open to the whole crew to sign up.'
                            )}
                          </div>
                        </div>

                        {user && (
                          <div className="flex items-center gap-2 shrink-0">
                            {isUserSignedUp ? (
                              <>
                                <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-100 text-pink-900 border border-pink-300 flex items-center gap-1 shadow-2xs">
                                  ✓ Signed Up
                                </span>
                                <button
                                  type="button"
                                  disabled={signingUpEventId === evt.id}
                                  onClick={() => handleInitiateSignUpToggle(evt)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                                >
                                  {signingUpEventId === evt.id ? 'Updating...' : 'Withdraw'}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={signingUpEventId === evt.id}
                                onClick={() => handleInitiateSignUpToggle(evt)}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white border border-pink-600 shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                              >
                                {signingUpEventId === evt.id ? 'Updating...' : 'Sign Up For Event'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end items-center">
                  <button
                    onClick={() => onNavigate('/attendance')}
                    className="px-4 py-2 bg-maroon hover:bg-[#660000] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    My Attendance
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Event Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-darkblue">Create New Event</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Event Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Arabiyya Rovers Camp 2026"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">From Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={fromDateTime}
                    onChange={(e) => setFromDateTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">To Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={toDateTime}
                    onChange={(e) => setToDateTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Event Type *</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  >
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Notification Channel</label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value as 'Email' | 'Telegram')}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="Email">Email Broadcast</option>
                    <option value="Telegram">Telegram Channel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Event Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Arabiyya School Hall / Kudagiri Island"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Publish Date & Time *</label>
                <input
                  type="datetime-local"
                  value={publishDateTime}
                  onChange={(e) => setPublishDateTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  On publish date, all users will be notified via {notificationType === 'Telegram' ? 'Telegram Channel' : 'Email'} and event will be visible in Our Events and Member Dashboard.
                </p>
              </div>

              {/* Sign-Up Event Toggle */}
              <div className="p-3.5 bg-pink-50/80 border border-pink-200 rounded-xl space-y-1">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSignUpEvent}
                    onChange={(e) => setIsSignUpEvent(e.target.checked)}
                    className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                  />
                  <span className="text-xs font-bold text-pink-900">Enable Open Crew Sign-Up</span>
                </label>
                <p className="text-[11px] text-pink-800 leading-relaxed pl-7">
                  When enabled, this event will be open for crew sign-ups. Attendance will be taken of members who signed up.
                </p>
              </div>

              {/* Requirement Scope Selector (All vs Location-Specific vs Specific Members) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Required Attendees Policy *</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRequirementMode('All');
                      setSelectedCities([]);
                      setMembersRequired([]);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      requirementMode === 'All'
                        ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    All Members
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRequirementMode('LocationBased');
                      setMembersRequired([]);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      requirementMode === 'LocationBased'
                        ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    📍 Location-Specific
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRequirementMode('Specific');
                      setSelectedCities([]);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      requirementMode === 'Specific'
                        ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Specific Members
                  </button>
                </div>

                {/* Location-Specific Mode (City Multi-Select with Member Cities List) */}
                {requirementMode === 'LocationBased' && (
                  <div className="border border-sky-200 rounded-xl p-3.5 bg-sky-50/40 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                      <div>
                        <span className="text-xs font-bold text-darkblue">Select Required Cities:</span>
                        <div className="text-[11px] text-gray-500">
                          Members residing in selected cities must attend. Others can join optionally without penalty.
                        </div>
                      </div>
                      <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full shrink-0">
                        {selectedCities.length} cities selected
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search member current address cities..."
                        value={citySearchQuery}
                        onChange={(e) => setCitySearchQuery(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-sky-500 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCities.length === memberCitiesList.length) {
                            setSelectedCities([]);
                          } else {
                            setSelectedCities(memberCitiesList.map(c => c.city));
                          }
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-bold border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 shrink-0"
                      >
                        {selectedCities.length === memberCitiesList.length ? 'Clear All' : 'Select All'}
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {memberCitiesList.filter(c => c.city.toLowerCase().includes(citySearchQuery.toLowerCase().trim())).length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-500">No member cities found matching search.</div>
                      ) : (
                        memberCitiesList
                          .filter(c => c.city.toLowerCase().includes(citySearchQuery.toLowerCase().trim()))
                          .map((item) => {
                            const isSelected = selectedCities.includes(item.city);
                            return (
                              <label
                                key={item.city}
                                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition-colors ${
                                  isSelected
                                    ? 'bg-white border-sky-400 shadow-2xs text-darkblue'
                                    : 'bg-white/80 border-gray-200 hover:bg-white text-gray-700'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setSelectedCities(selectedCities.filter(c => c !== item.city));
                                      } else {
                                        setSelectedCities([...selectedCities, item.city]);
                                      }
                                    }}
                                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                                  />
                                  <div>
                                    <span className="text-xs font-bold">{item.city}</span>
                                    <div className="text-[10px] text-gray-500">
                                      {item.members.map((m: any) => m.commonName || m.fullName).slice(0, 3).join(', ')}
                                      {item.members.length > 3 ? ` +${item.members.length - 3} more` : ''}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md shrink-0">
                                  {item.count} {item.count === 1 ? 'member' : 'members'}
                                </span>
                              </label>
                            );
                          })
                      )}
                    </div>

                    <div className="text-[11px] text-gray-600 bg-white p-2.5 rounded-lg border border-sky-100 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Suspension Policy:</strong> Voluntary suspended members are automatically excused from mandatory attendance across all required meetings.
                      </span>
                    </div>
                  </div>
                )}

                {/* Specific Members Mode */}
                {requirementMode === 'Specific' && (
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-[11px] font-bold text-gray-700">Select Required Members:</span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {membersRequired.length} selected
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Search member name or city..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white mb-2 focus:ring-1 focus:ring-sky-500 outline-hidden"
                    />

                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                      {allMembers.filter(m => {
                        const q = memberSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        const nameMatch = (m.fullName || '').toLowerCase().includes(q) || (m.commonName || '').toLowerCase().includes(q);
                        const cityMatch = getMemberCity(m).toLowerCase().includes(q);
                        return nameMatch || cityMatch;
                      }).length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-500">No matching members found.</div>
                      ) : (
                        allMembers.filter(m => {
                          const q = memberSearchQuery.toLowerCase().trim();
                          if (!q) return true;
                          const nameMatch = (m.fullName || '').toLowerCase().includes(q) || (m.commonName || '').toLowerCase().includes(q);
                          const cityMatch = getMemberCity(m).toLowerCase().includes(q);
                          return nameMatch || cityMatch;
                        }).map((m) => {
                          const isSelected = membersRequired.includes(m.id);
                          const memberCity = getMemberCity(m);
                          return (
                            <label
                              key={m.id}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-sky-50/50' : 'hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setMembersRequired(membersRequired.filter(id => id !== m.id));
                                    } else {
                                      setMembersRequired([...membersRequired, m.id]);
                                    }
                                  }}
                                  className="rounded border-gray-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                                />
                                <span className="text-xs font-bold text-gray-800">
                                  {m.commonName || m.fullName}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span 
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    (m.status === 'Investiture' || m.status === 'Approved' || m.status === 'Active')
                                      ? 'bg-emerald-500'
                                      : 'bg-amber-500'
                                  }`}
                                  title={(m.status === 'Investiture' || m.status === 'Approved' || m.status === 'Active') ? 'Invested & Active' : 'Pending Investiture'}
                                />
                                {memberCity && (
                                  <span className="text-[10px] font-bold text-maroon bg-red-50 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                    {memberCity}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Event Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide activity details and requirements..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl">{formError}</div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-bold rounded-xl text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-maroon text-white text-xs font-bold rounded-xl hover:bg-[#660000]"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Event Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-blue-200 max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-darkblue">Edit Event Details</h3>
              </div>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEventId(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Event Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Arabiyya Rovers Camp 2026"
                  value={editEventName}
                  onChange={(e) => setEditEventName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">From Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={editFromDateTime}
                    onChange={(e) => setEditFromDateTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">To Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={editToDateTime}
                    onChange={(e) => setEditToDateTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Event Type *</label>
                  <select
                    value={editEventType}
                    onChange={(e) => setEditEventType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  >
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Notification Channel</label>
                  <select
                    value={editNotificationType}
                    onChange={(e) => setEditNotificationType(e.target.value as 'Email' | 'Telegram')}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="Email">Email Broadcast</option>
                    <option value="Telegram">Telegram Channel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Event Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Arabiyya School Hall / Kudagiri Island"
                  value={editEventLocation}
                  onChange={(e) => setEditEventLocation(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Publish Date & Time *</label>
                <input
                  type="datetime-local"
                  value={editPublishDateTime}
                  onChange={(e) => setEditPublishDateTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Event is visible to members from this date & time onwards.
                </p>
              </div>

              {/* Edit Sign-Up Event Toggle */}
              <div className="p-3.5 bg-pink-50/80 border border-pink-200 rounded-xl space-y-1">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsSignUpEvent}
                    onChange={(e) => setEditIsSignUpEvent(e.target.checked)}
                    className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                  />
                  <span className="text-xs font-bold text-pink-900">Enable Open Crew Sign-Up</span>
                </label>
                <p className="text-[11px] text-pink-800 leading-relaxed pl-7">
                  When enabled, this event will be open for crew sign-ups. Attendance will be taken of members who signed up.
                </p>
              </div>

              {/* Requirement Scope Selector (All vs Location-Specific vs Specific Members) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Required Attendees Policy *</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditRequirementMode('All');
                      setEditSelectedCities([]);
                      setEditMembersRequired([]);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      editRequirementMode === 'All'
                        ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    All Members
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditRequirementMode('LocationBased');
                      setEditMembersRequired([]);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      editRequirementMode === 'LocationBased'
                        ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    📍 Location-Specific
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditRequirementMode('Specific');
                      setEditSelectedCities([]);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      editRequirementMode === 'Specific'
                        ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Specific Members
                  </button>
                </div>

                {/* Location-Specific Mode in Edit */}
                {editRequirementMode === 'LocationBased' && (
                  <div className="border border-sky-200 rounded-xl p-3.5 bg-sky-50/40 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                      <div>
                        <span className="text-xs font-bold text-darkblue">Select Required Cities:</span>
                        <div className="text-[11px] text-gray-500">
                          Members residing in selected cities must attend. Others can join optionally without penalty.
                        </div>
                      </div>
                      <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full shrink-0">
                        {editSelectedCities.length} cities selected
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search member current address cities..."
                        value={editCitySearchQuery}
                        onChange={(e) => setEditCitySearchQuery(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-sky-500 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editSelectedCities.length === memberCitiesList.length) {
                            setEditSelectedCities([]);
                          } else {
                            setEditSelectedCities(memberCitiesList.map(c => c.city));
                          }
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-bold border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 shrink-0"
                      >
                        {editSelectedCities.length === memberCitiesList.length ? 'Clear All' : 'Select All'}
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {memberCitiesList.filter(c => c.city.toLowerCase().includes(editCitySearchQuery.toLowerCase().trim())).length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-500">No member cities found matching search.</div>
                      ) : (
                        memberCitiesList
                          .filter(c => c.city.toLowerCase().includes(editCitySearchQuery.toLowerCase().trim()))
                          .map((item) => {
                            const isSelected = editSelectedCities.includes(item.city);
                            return (
                              <label
                                key={item.city}
                                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition-colors ${
                                  isSelected
                                    ? 'bg-white border-sky-400 shadow-2xs text-darkblue'
                                    : 'bg-white/80 border-gray-200 hover:bg-white text-gray-700'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setEditSelectedCities(editSelectedCities.filter(c => c !== item.city));
                                      } else {
                                        setEditSelectedCities([...editSelectedCities, item.city]);
                                      }
                                    }}
                                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                                  />
                                  <div>
                                    <span className="text-xs font-bold">{item.city}</span>
                                    <div className="text-[10px] text-gray-500">
                                      {item.members.map((m: any) => m.commonName || m.fullName).slice(0, 3).join(', ')}
                                      {item.members.length > 3 ? ` +${item.members.length - 3} more` : ''}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md shrink-0">
                                  {item.count} {item.count === 1 ? 'member' : 'members'}
                                </span>
                              </label>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

                {/* Specific Members in Edit */}
                {editRequirementMode === 'Specific' && (
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-[11px] font-bold text-gray-700">Select Required Members:</span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {editMembersRequired.length} selected
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Search member name or city..."
                      value={editMemberSearchQuery}
                      onChange={(e) => setEditMemberSearchQuery(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white mb-2 focus:ring-1 focus:ring-sky-500 outline-hidden"
                    />

                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                      {allMembers.filter(m => {
                        const q = editMemberSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        const nameMatch = (m.fullName || '').toLowerCase().includes(q) || (m.commonName || '').toLowerCase().includes(q);
                        const cityMatch = getMemberCity(m).toLowerCase().includes(q);
                        return nameMatch || cityMatch;
                      }).length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-500">No matching members found.</div>
                      ) : (
                        allMembers.filter(m => {
                          const q = editMemberSearchQuery.toLowerCase().trim();
                          if (!q) return true;
                          const nameMatch = (m.fullName || '').toLowerCase().includes(q) || (m.commonName || '').toLowerCase().includes(q);
                          const cityMatch = getMemberCity(m).toLowerCase().includes(q);
                          return nameMatch || cityMatch;
                        }).map((m) => {
                          const isSelected = editMembersRequired.includes(m.id);
                          const memberCity = getMemberCity(m);
                          return (
                            <label
                              key={m.id}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-sky-50/50' : 'hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setEditMembersRequired(editMembersRequired.filter(id => id !== m.id));
                                    } else {
                                      setEditMembersRequired([...editMembersRequired, m.id]);
                                    }
                                  }}
                                  className="rounded border-gray-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                                />
                                <span className="text-xs font-bold text-gray-800">
                                  {m.commonName || m.fullName}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span 
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    (m.status === 'Investiture' || m.status === 'Approved' || m.status === 'Active')
                                      ? 'bg-emerald-500'
                                      : 'bg-amber-500'
                                  }`}
                                  title={(m.status === 'Investiture' || m.status === 'Approved' || m.status === 'Active') ? 'Invested & Active' : 'Pending Investiture'}
                                />
                                {memberCity && (
                                  <span className="text-[10px] font-bold text-maroon bg-red-50 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                    {memberCity}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Event Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide activity details and requirements..."
                  value={editEventDescription}
                  onChange={(e) => setEditEventDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="editNotifyCheckbox"
                  checked={editNotifyMembers}
                  onChange={(e) => setEditNotifyMembers(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="editNotifyCheckbox" className="text-xs text-gray-800 font-medium cursor-pointer">
                  Notify members of schedule updates now via <strong>{editNotificationType === 'Telegram' ? 'Telegram Channel' : 'Email Broadcast'}</strong>
                </label>
              </div>

              {editFormError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl">{editFormError}</div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEventId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-xs font-bold rounded-xl text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Dispatch Preview Modal */}
      {dispatchResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-darkblue mb-1">
              Notification Announcement Dispatched!
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Channel: <strong>{dispatchResult.notificationType}</strong> • Target: {dispatchResult.dispatchedTo}
            </p>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-left font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed mb-6">
              {dispatchResult.announcementMessage}
            </div>

            <button
              onClick={() => setDispatchResult(null)}
              className="w-full py-2.5 bg-darkblue text-white font-bold text-xs rounded-xl hover:bg-blue-900"
            >
              Close Announcement
            </button>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(eventPendingDelete)}
        onClose={() => {
          if (!isDeletingEvent) setEventPendingDelete(null);
        }}
        onConfirm={confirmDeleteEvent}
        title="Confirm Event Deletion"
        description="Are you sure you want to delete this scheduled Arabiyya event? This will remove the event listing and any gatekeeper attendance triggers."
        itemName={eventPendingDelete ? eventPendingDelete.name : undefined}
        itemDetails={
          eventPendingDelete ? (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1 text-[11px] text-gray-700">
              <div><strong>Type:</strong> {eventPendingDelete.eventType}</div>
              <div><strong>Location:</strong> {eventPendingDelete.location}</div>
              <div><strong>From:</strong> {eventPendingDelete.fromDateTime.replace('T', ' ')}</div>
            </div>
          ) : undefined
        }
        confirmText="Yes, Delete Event"
        cancelText="Cancel"
        isDeleting={isDeletingEvent}
      />

      {/* Sign-Up Action Confirmation Modal */}
      {confirmSignUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-pink-200 max-w-md w-full p-6 text-center space-y-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs ${
              confirmSignUpModal.isSignedUp ? 'bg-amber-100 text-amber-700' : 'bg-pink-100 text-pink-600'
            }`}>
              <Calendar className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {confirmSignUpModal.isSignedUp ? 'Confirm Sign-Up Withdrawal' : 'Confirm Event Sign Up'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {confirmSignUpModal.isSignedUp
                  ? 'Are you sure you want to withdraw your sign-up for this event?'
                  : 'Are you sure you want to sign up for this open crew event?'}
              </p>
            </div>

            <div className="p-4 bg-pink-50/70 rounded-xl border border-pink-200 text-left space-y-2">
              <div className="text-xs font-bold text-pink-950 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                <span>{confirmSignUpModal.event.name}</span>
              </div>
              <div className="text-[11px] text-gray-600 space-y-1 pl-3.5 border-l-2 border-pink-300">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-pink-600" />
                  <span>{confirmSignUpModal.event.fromDateTime ? confirmSignUpModal.event.fromDateTime.replace('T', ' ') : 'Scheduled Event'}</span>
                </div>
                {confirmSignUpModal.event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-pink-600" />
                    <span>{confirmSignUpModal.event.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSignUpModal(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignUp}
                className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-md transition-all ${
                  confirmSignUpModal.isSignedUp
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-pink-600 hover:bg-pink-700'
                }`}
              >
                {confirmSignUpModal.isSignedUp ? 'Yes, Withdraw Sign-Up' : 'Yes, Sign Me Up!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign-Up Success Confirmatory Modal */}
      {signUpSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-6 text-center space-y-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              signUpSuccessModal.isSignUp ? 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50' : 'bg-blue-100 text-blue-600 ring-8 ring-blue-50'
            }`}>
              {signUpSuccessModal.isSignUp ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <Info className="w-8 h-8" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {signUpSuccessModal.title}
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {signUpSuccessModal.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSignUpSuccessModal(null)}
              className="w-full py-2.5 bg-maroon text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#660000] transition-colors"
            >
              Awesome, Got It!
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
