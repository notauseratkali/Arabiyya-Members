import React, { useState, useEffect } from 'react';
import { formatDateTimeDDMMMYYYY } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { AnnouncementItem, AnnouncementPresetTemplate } from '../types';
import {
  Megaphone,
  Mail,
  Send,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Eye,
  Layers,
  Users,
  Tag,
  Share2,
  Check,
  Plus,
  Edit2,
  Bookmark,
  Save,
  X,
  FileText,
  SlidersHorizontal,
  Search,
  Bell,
  CheckCheck,
  Shield,
  ArrowRight,
  UserCheck,
  SendHorizontal
} from 'lucide-react';
import { fetchWithRetry } from '../utils/fetchUtils';

interface AnnouncementsPageProps {
  onNavigate: (path: string) => void;
}

const CATEGORIES = [
  'General',
  'Important',
  'Urgent',
  'Event',
  'Investiture',
  'Training'
] as const;

const AUDIENCES = [
  { id: 'All', label: 'All Members & Candidates' },
  { id: 'Explorers', label: 'Explorers Only (Ages 16-17)' },
  { id: 'Rovers', label: 'Rovers Only (Ages 18-25)' },
  { id: 'Leaders', label: 'Leaders & Council Members' },
  { id: 'Specific', label: 'Specific Members...' }
] as const;

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ onNavigate }) => {
  const { user, isSecretary: authIsSecretary } = useAuth();
  
  // Robust check for administrative/secretary broadcast privileges
  const isSecretary = Boolean(
    authIsSecretary ||
    (user && (
      user.role === 'Secretary' ||
      user.role === 'Admin' ||
      user.isAdmin === true ||
      user.username === 'admin' ||
      user.email === 'nazihnafiz@gmail.com' ||
      user.email === 'it@arabiyyascouts.org' ||
      user.email === 'admin@arabiyyarovers.net'
    ))
  );

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [presets, setPresets] = useState<AnnouncementPresetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPresets, setLoadingPresets] = useState(false);

  // Secretary Broadcast Composer State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('General');
  const [targetAudience, setTargetAudience] = useState<string>('All');
  const [targetMemberIds, setTargetMemberIds] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  const [sendEmailChannel, setSendEmailChannel] = useState(true);
  const [sendTelegramChannel, setSendTelegramChannel] = useState(true);
  const [sendInAppChannel, setSendInAppChannel] = useState(true);
  const [actionUrl, setActionUrl] = useState('');
  const [actionText, setActionText] = useState('View Details');

  // Preview & Submission State
  const [previewTab, setPreviewTab] = useState<'email' | 'telegram'>('email');
  const [dispatching, setDispatching] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Filter & Search State
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Active Tab for Secretary (Dispatch Studio vs Member Feed vs Logs)
  const [activeTab, setActiveTab] = useState<'dispatch' | 'feed' | 'logs'>('dispatch');

  // Preset Template Modal State
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<AnnouncementPresetTemplate | null>(null);
  const [presetFormName, setPresetFormName] = useState('');
  const [presetFormTitle, setPresetFormTitle] = useState('');
  const [presetFormCategory, setPresetFormCategory] = useState<typeof CATEGORIES[number]>('General');
  const [presetFormAudience, setPresetFormAudience] = useState<string>('All');
  const [presetFormChannels, setPresetFormChannels] = useState<('Email' | 'Telegram' | 'InApp')[]>(['Email', 'Telegram', 'InApp']);
  const [presetFormMessage, setPresetFormMessage] = useState('');
  const [presetFormActionUrl, setPresetFormActionUrl] = useState('');
  const [presetFormActionText, setPresetFormActionText] = useState('View Details');
  const [savingPreset, setSavingPreset] = useState(false);
  const [activeAppliedPresetId, setActiveAppliedPresetId] = useState<string | null>(null);

  const loadAnnouncements = () => {
    setLoading(true);
    const memberQuery = user?.id ? `?memberId=${encodeURIComponent(user.id)}` : '';
    fetchWithRetry(`/api/announcements${memberQuery}`)
      .then((res) => res.json())
      .then((data) => {
        setAnnouncements(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadPresets = () => {
    setLoadingPresets(true);
    fetchWithRetry('/api/announcements/presets')
      .then((res) => res.json())
      .then((data) => {
        setPresets(Array.isArray(data) ? data : []);
        setLoadingPresets(false);
      })
      .catch(() => setLoadingPresets(false));
  };

  const loadMembers = () => {
    fetchWithRetry('/api/members')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAnnouncements();
    if (isSecretary) {
      loadPresets();
      loadMembers();
    }
  }, [isSecretary, user?.id]);

  const handleMarkRead = async (announcementId?: string, all = false) => {
    if (!user) return;
    try {
      const res = await fetchWithRetry('/api/announcements/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: user.id,
          announcementId,
          all
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setAnnouncements((prev) =>
          prev.map((ann) => {
            if (all || (announcementId && ann.id === announcementId)) {
              return { ...ann, isRead: true };
            }
            return ann;
          })
        );
        window.dispatchEvent(new CustomEvent('arabiyya_announcements_updated'));
      }
    } catch (err) {
      console.error('Error marking announcement read:', err);
    }
  };

  // Quick Preset Handlers
  const applyPresetTemplate = (p: AnnouncementPresetTemplate) => {
    setTitle(p.title);
    setMessage(p.message);
    setCategory(p.category || 'General');
    if (p.actionUrl !== undefined) setActionUrl(p.actionUrl);
    if (p.actionText !== undefined) setActionText(p.actionText || 'View Details');
    if (p.targetAudience) setTargetAudience(p.targetAudience);
    if (p.channels && p.channels.length > 0) {
      setSendEmailChannel(p.channels.includes('Email'));
      setSendTelegramChannel(p.channels.includes('Telegram'));
      setSendInAppChannel(p.channels.includes('InApp'));
    }
    setActiveAppliedPresetId(p.id);
  };

  const handleOpenCreatePresetModal = () => {
    setEditingPreset(null);
    setPresetFormName(title ? `${title.slice(0, 24)}...` : '');
    setPresetFormTitle(title || '');
    setPresetFormCategory(category);
    setPresetFormAudience(targetAudience);
    const currentChannels: ('Email' | 'Telegram' | 'InApp')[] = [];
    if (sendEmailChannel) currentChannels.push('Email');
    if (sendTelegramChannel) currentChannels.push('Telegram');
    if (sendInAppChannel) currentChannels.push('InApp');
    setPresetFormChannels(currentChannels.length > 0 ? currentChannels : ['Email', 'Telegram', 'InApp']);
    setPresetFormMessage(message || '');
    setPresetFormActionUrl(actionUrl || '');
    setPresetFormActionText(actionText || 'View Details');
    setIsPresetModalOpen(true);
  };

  const handleOpenEditPresetModal = (p: AnnouncementPresetTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPreset(p);
    setPresetFormName(p.name);
    setPresetFormTitle(p.title);
    setPresetFormCategory(p.category || 'General');
    setPresetFormAudience(p.targetAudience || 'All');
    setPresetFormChannels(p.channels || ['Email', 'Telegram', 'InApp']);
    setPresetFormMessage(p.message);
    setPresetFormActionUrl(p.actionUrl || '');
    setPresetFormActionText(p.actionText || 'View Details');
    setIsPresetModalOpen(true);
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetFormName.trim() || !presetFormTitle.trim() || !presetFormMessage.trim()) {
      setFeedback({
        success: false,
        message: 'Please provide a preset name, announcement headline, and message body.'
      });
      return;
    }

    setSavingPreset(true);
    try {
      const payload = {
        name: presetFormName.trim(),
        title: presetFormTitle.trim(),
        category: presetFormCategory,
        targetAudience: presetFormAudience,
        channels: presetFormChannels,
        message: presetFormMessage.trim(),
        actionUrl: presetFormActionUrl.trim(),
        actionText: presetFormActionText.trim()
      };

      const url = editingPreset
        ? `/api/announcements/presets/${editingPreset.id}`
        : '/api/announcements/presets';
      const method = editingPreset ? 'PUT' : 'POST';

      const res = await fetchWithRetry(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setSavingPreset(false);

      if (res.ok) {
        setPresets(data.presets || []);
        setIsPresetModalOpen(false);
        setEditingPreset(null);
      } else {
        setFeedback({ success: false, message: data.error || 'Failed to save preset template.' });
      }
    } catch (err: any) {
      setSavingPreset(false);
      setFeedback({ success: false, message: err.message || 'Error communicating with server.' });
    }
  };

  const handleDeletePreset = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetchWithRetry(`/api/announcements/presets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setPresets(data.presets || []);
        if (activeAppliedPresetId === id) setActiveAppliedPresetId(null);
      }
    } catch {
      // ignore
    }
  };

  // Main Dispatch Handler
  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!title.trim()) {
      setFeedback({ success: false, message: 'Please provide an announcement headline / title.' });
      return;
    }
    if (!message.trim()) {
      setFeedback({ success: false, message: 'Please provide an announcement message body.' });
      return;
    }

    if (targetAudience === 'Specific' && targetMemberIds.length === 0) {
      setFeedback({ success: false, message: 'Please select at least one specific member to receive this announcement.' });
      return;
    }

    const channels: ('Email' | 'Telegram' | 'InApp')[] = [];
    if (sendEmailChannel) channels.push('Email');
    if (sendTelegramChannel) channels.push('Telegram');
    if (sendInAppChannel) channels.push('InApp');

    if (channels.length === 0) {
      setFeedback({ success: false, message: 'Please select at least one delivery channel (Email, Telegram, or In-App).' });
      return;
    }

    setDispatching(true);

    try {
      const res = await fetchWithRetry('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          category,
          targetAudience,
          targetMemberIds: targetAudience === 'Specific' ? targetMemberIds : [],
          channels,
          actionUrl: actionUrl.trim() || undefined,
          actionText: actionText.trim() || 'View Details',
          dispatchedBy: user?.fullName || 'Secretary of Arabiyya Rover Council'
        })
      });

      const data = await res.json();
      setDispatching(false);

      if (res.ok) {
        setFeedback({
          success: true,
          message: data.message || 'Announcement successfully broadcasted across selected channels!',
          details: data.results
        });
        // Reset form
        setTitle('');
        setMessage('');
        setActionUrl('');
        setTargetMemberIds([]);
        setActiveAppliedPresetId(null);
        loadAnnouncements();
        window.dispatchEvent(new CustomEvent('arabiyya_announcements_updated'));
      } else {
        setFeedback({
          success: false,
          message: data.error || 'Failed to dispatch announcement.'
        });
      }
    } catch (err: any) {
      setDispatching(false);
      setFeedback({
        success: false,
        message: err.message || 'Network error during broadcast dispatch.'
      });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await fetchWithRetry(`/api/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAnnouncements();
        window.dispatchEvent(new CustomEvent('arabiyya_announcements_updated'));
      }
    } catch {
      // ignore
    }
  };

  const toggleMemberSelection = (id: string) => {
    setTargetMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const filteredMembers = members.filter((m) => {
    if (!memberSearchQuery) return true;
    const q = memberSearchQuery.toLowerCase();
    return (
      (m.fullName && m.fullName.toLowerCase().includes(q)) ||
      (m.idCardNumber && m.idCardNumber.toLowerCase().includes(q)) ||
      (m.role && m.role.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  });

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  const filteredAnnouncements = announcements.filter((a) => {
    const matchCat = filterCategory === 'All' || a.category === filterCategory;
    const matchUnread = !filterUnreadOnly || !a.isRead;
    const matchSearch =
      !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchUnread && matchSearch;
  });

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Urgent':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Important':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Event':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Investiture':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Training':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-blue-100 text-darkblue border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      
      {/* TOP HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-maroon font-bold text-xs uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4 text-maroon" />
            <span>Arabiyya Rover Network Broadcasts</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black text-darkblue tracking-tight">
              Official Announcements
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black ring-2 ring-rose-100">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Live communications, assembly circulars, and instant channel notices for Arabiyya Rover Council.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={() => handleMarkRead(undefined, true)}
              className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-darkblue text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 border border-sky-200"
            >
              <CheckCheck className="w-4 h-4 text-sky-600" />
              <span>Mark all read</span>
            </button>
          )}

          {isSecretary && (
            <button
              onClick={() => onNavigate('/settings')}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <span>SMTP & Bot Config</span>
            </button>
          )}
        </div>
      </div>

      {/* SECRETARY NAVIGATION TABS */}
      {isSecretary && (
        <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'dispatch'
                ? 'bg-darkblue text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose & Broadcast</span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-darkblue text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Member Feed & Notices</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-darkblue text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dispatch History ({announcements.length})</span>
          </button>
        </div>
      )}

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-start space-x-3 shadow-xs animate-in fade-in ${
            feedback.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 flex-1">
            <div className="font-bold">{feedback.message}</div>
            {feedback.details && (
              <div className="text-[11px] text-gray-600 font-normal">
                Emails Sent: <strong>{feedback.details.emailCount}</strong> • Telegram Channel: <strong>{feedback.details.telegramStatus}</strong> • In-App: <strong>Active</strong>
              </div>
            )}
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: DISPATCH STUDIO (COMPOSER) */}
      {isSecretary && activeTab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form & Presets */}
          <div className="lg:col-span-7 space-y-6 bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            
            {/* Presets Header */}
            <div className="space-y-3 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bookmark className="w-4 h-4 text-maroon" />
                  <h3 className="text-xs font-bold text-darkblue uppercase tracking-wider">
                    Quick Preset Templates
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreatePresetModal}
                  className="text-[11px] font-bold text-darkblue hover:text-blue-900 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save / New Template</span>
                </button>
              </div>

              {loadingPresets ? (
                <div className="text-xs text-gray-400 py-2">Loading presets...</div>
              ) : presets.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500">
                  No preset templates yet. Click <strong>Save / New Template</strong> to save frequently dispatched messages.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {presets.map((p) => {
                    const isApplied = activeAppliedPresetId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => applyPresetTemplate(p)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                          isApplied
                            ? 'bg-blue-50 border-darkblue ring-1 ring-darkblue'
                            : 'bg-white hover:bg-slate-50 border-gray-200 shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(p.category)}`}>
                              {p.category}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditPresetModal(p, e)}
                                className="p-1 text-gray-400 hover:text-darkblue rounded"
                                title="Edit template"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeletePreset(p.id, p.name, e)}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded"
                                title="Delete template"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <h4 className="text-xs font-bold text-darkblue line-clamp-1">{p.name}</h4>
                          <p className="text-[11px] text-gray-500 line-clamp-2">{p.message}</p>
                        </div>
                        <div className="mt-2 pt-1 border-t border-gray-100 flex items-center justify-between text-[10px]">
                          <span className="text-gray-400">{p.targetAudience || 'All'}</span>
                          <span className="font-bold text-darkblue">{isApplied ? '✓ Applied' : 'Apply →'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Compose Form */}
            <form onSubmit={handleDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Announcement Headline / Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory Troop Assembly for National Day Camp"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Category Tag
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium"
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific Member Picker */}
              {targetAudience === 'Specific' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-darkblue uppercase tracking-wider flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-maroon" />
                      <span>Select Specific Members ({targetMemberIds.length} chosen)</span>
                    </label>
                    {targetMemberIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTargetMemberIds([])}
                        className="text-[11px] text-rose-600 hover:underline font-bold"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter members by name, ID, role..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {filteredMembers.length === 0 ? (
                      <div className="text-center py-3 text-xs text-gray-400">No members found matching filter</div>
                    ) : (
                      filteredMembers.map((m) => {
                        const isSelected = targetMemberIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => toggleMemberSelection(m.id)}
                            className={`p-2 rounded-lg flex items-center justify-between cursor-pointer text-xs transition-colors ${
                              isSelected ? 'bg-blue-50 text-darkblue font-bold' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-darkblue pointer-events-none"
                              />
                              <span>{m.fullName || 'Member'}</span>
                              <span className="text-[10px] text-gray-400">({m.idCardNumber || m.role})</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {m.role || 'Member'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Channels */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Delivery Channels
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`p-2.5 rounded-xl border flex items-center space-x-2 cursor-pointer transition-all ${
                    sendEmailChannel ? 'bg-blue-50 border-blue-200 text-darkblue' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}>
                    <input
                      type="checkbox"
                      checked={sendEmailChannel}
                      onChange={(e) => setSendEmailChannel(e.target.checked)}
                      className="rounded text-darkblue"
                    />
                    <span className="text-xs font-bold">Email</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center space-x-2 cursor-pointer transition-all ${
                    sendTelegramChannel ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}>
                    <input
                      type="checkbox"
                      checked={sendTelegramChannel}
                      onChange={(e) => setSendTelegramChannel(e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span className="text-xs font-bold">Telegram</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center space-x-2 cursor-pointer transition-all ${
                    sendInAppChannel ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}>
                    <input
                      type="checkbox"
                      checked={sendInAppChannel}
                      onChange={(e) => setSendInAppChannel(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span className="text-xs font-bold">In-App</span>
                  </label>
                </div>
              </div>

              {/* Body Message */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Announcement Body *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Write your official communication here. Double-line breaks create paragraphs..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-normal border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon leading-relaxed"
                />
              </div>

              {/* Action Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Action Link (e.g. /events, /logbook, https://...)
                  </label>
                  <input
                    type="text"
                    placeholder="/events"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Action Button Text
                  </label>
                  <input
                    type="text"
                    placeholder="View Details"
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Submit Dispatch Button */}
              <button
                type="submit"
                disabled={dispatching || !title.trim() || !message.trim()}
                className="w-full py-3.5 bg-maroon hover:bg-[#660000] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {dispatching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Broadcasting Across Channels...</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-4 h-4" />
                    <span>Dispatch Official Announcement Now</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Dispatch Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-darkblue" />
                  <h3 className="text-xs font-bold text-darkblue uppercase tracking-wider">
                    Live Broadcast Preview
                  </h3>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('email')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      previewTab === 'email' ? 'bg-white text-darkblue shadow-2xs' : 'text-gray-500'
                    }`}
                  >
                    ✉️ Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('telegram')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      previewTab === 'telegram' ? 'bg-white text-sky-700 shadow-2xs' : 'text-gray-500'
                    }`}
                  >
                    ✈️ Telegram
                  </button>
                </div>
              </div>

              {previewTab === 'email' ? (
                <div className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="text-[11px] text-gray-500 border-b border-gray-200 pb-2 space-y-0.5">
                    <div><strong>From:</strong> Arabiyya Rover Council &lt;secretary@arabiyyarovers.org&gt;</div>
                    <div><strong>To:</strong> {targetAudience === 'Specific' ? `${targetMemberIds.length} Selected Members` : targetAudience}</div>
                    <div><strong>Subject:</strong> [{category.toUpperCase()}] {title || 'Announcement Title'}</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                    {message || 'Announcement message content will render here...'}
                  </div>
                  {actionUrl && (
                    <div className="pt-2">
                      <span className="inline-block px-4 py-2 bg-darkblue text-white font-bold rounded-lg text-xs">
                        {actionText || 'View Details'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-sky-200 rounded-xl p-4 bg-[#0e1621] text-white space-y-2 font-mono text-xs">
                  <div className="text-sky-400 font-bold">📢 ARABIYYA ROVER BROADCAST</div>
                  <div className="text-amber-300 font-bold">[{category.toUpperCase()}] {title || 'Headline'}</div>
                  <div className="text-gray-300 whitespace-pre-line font-sans text-xs">
                    {message || 'Telegram broadcast text preview...'}
                  </div>
                  {actionUrl && (
                    <div className="text-sky-400 text-[11px] font-sans">
                      🔗 {actionText || 'View Details'}: {actionUrl}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Protocol Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-darkblue space-y-2">
              <div className="font-bold flex items-center space-x-1.5">
                <Radio className="w-4 h-4 text-maroon" />
                <span>Multi-Channel Dispatch Engine</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                When you dispatch an announcement, the system automatically sends personalized emails, broadcasts directly to the Arabiyya Telegram Channel, and persists real-time in-app notification badges for all recipient accounts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 / MEMBER VIEW: ANNOUNCEMENT FEED */}
      {(!isSecretary || activeTab === 'feed') && (
        <div className="space-y-4">
          
          {/* Feed Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                onClick={() => setFilterCategory('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterCategory === 'All'
                    ? 'bg-darkblue text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    filterCategory === cat
                      ? 'bg-darkblue text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <button
                onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all flex items-center space-x-1.5 ${
                  filterUnreadOnly
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-rose-600" />
                <span>Unread Only</span>
              </button>

              <div className="relative flex-1 md:w-60">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-darkblue"
                />
              </div>

              <button
                onClick={loadAnnouncements}
                className="p-2 text-gray-600 hover:text-darkblue hover:bg-gray-100 rounded-xl border border-gray-200"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <RefreshCw className="w-8 h-8 text-darkblue animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500">Loading announcements...</p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-500 space-y-2">
              <Megaphone className="w-10 h-10 text-gray-300 mx-auto stroke-[1.5]" />
              <p className="text-sm font-bold text-darkblue">No announcements match your filter</p>
              <p className="text-xs text-gray-400">All current notices and circulars have been read.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className={`bg-white rounded-2xl p-5 border transition-all ${
                    !ann.isRead
                      ? 'border-rose-300 ring-1 ring-rose-200 shadow-md bg-gradient-to-r from-rose-50/20 to-white'
                      : 'border-gray-200 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${getCategoryBadgeClass(ann.category)}`}>
                          {ann.category}
                        </span>
                        {!ann.isRead && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>Unread</span>
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-medium">
                          {formatDateTimeDDMMMYYYY(ann.dispatchedAt || ann.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-darkblue tracking-tight">
                        {ann.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 self-start">
                      {!ann.isRead ? (
                        <button
                          onClick={() => handleMarkRead(ann.id, false)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mark Read</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium flex items-center space-x-1 px-2 py-1 bg-gray-50 rounded-lg">
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Read</span>
                        </span>
                      )}

                      {isSecretary && (
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Announcement Message Body */}
                  <div className="py-4 text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line font-normal">
                    {ann.message}
                  </div>

                  {/* Footer Info & Action Link */}
                  <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="text-[11px] text-gray-500 flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-maroon" />
                      <span>Issued by: <strong className="text-darkblue">{ann.dispatchedBy}</strong></span>
                    </div>

                    {ann.actionUrl && (
                      <button
                        onClick={() => {
                          if (!ann.isRead) handleMarkRead(ann.id, false);
                          if (ann.actionUrl?.startsWith('http')) {
                            window.open(ann.actionUrl, '_blank', 'noreferrer');
                          } else if (ann.actionUrl) {
                            onNavigate(ann.actionUrl);
                          }
                        }}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-darkblue hover:bg-blue-900 text-white rounded-xl font-bold transition-all text-xs shadow-2xs group cursor-pointer"
                      >
                        <span>{ann.actionText || 'View Details'}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DISPATCH LOGS & DELIVERY HISTORY */}
      {isSecretary && activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-gray-50/50">
            <div>
              <h2 className="text-sm font-bold text-darkblue">Dispatched Announcements Log</h2>
              <p className="text-xs text-gray-500">History of official announcements and multi-channel broadcast records</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadAnnouncements}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-darkblue cursor-pointer"
                title="Refresh logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-xs text-gray-500">Loading announcement records...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500">
              No announcements found. Use the Compose tab to dispatch your first announcement.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Announcement</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Channels Triggered</th>
                    <th className="px-4 py-3">Dispatched Time</th>
                    <th className="px-4 py-3">Sender</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {announcements.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-center space-x-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getCategoryBadgeClass(item.category)}`}
                          >
                            {item.category}
                          </span>
                          <span className="font-bold text-darkblue truncate">{item.title}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2">{item.message}</p>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        <span className="bg-slate-100 px-2 py-1 rounded-md font-semibold text-[11px]">
                          {item.targetAudience}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.channels?.map((ch) => (
                            <span
                              key={ch}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                ch === 'Email'
                                  ? 'bg-blue-100 text-blue-800'
                                  : ch === 'Telegram'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {ch === 'Email' && `✉️ Email (${item.emailCount ?? 0})`}
                              {ch === 'Telegram' && `✈️ Telegram ${item.telegramDelivered ? '✓' : ''}`}
                              {ch === 'InApp' && '📢 In-App'}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-500 text-[11px]">
                        {formatDateTimeDDMMMYYYY(item.dispatchedAt || item.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-darkblue font-semibold text-[11px]">
                        {item.dispatchedBy}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteAnnouncement(item.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Preset Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-darkblue">
                {editingPreset ? 'Edit Preset Template' : 'New Preset Template'}
              </h3>
              <button onClick={() => setIsPresetModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Preset Template Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Council Notice"
                  value={presetFormName}
                  onChange={(e) => setPresetFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Default Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rover Monthly Meeting"
                  value={presetFormTitle}
                  onChange={(e) => setPresetFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Message Body *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Preset message text..."
                  value={presetFormMessage}
                  onChange={(e) => setPresetFormMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPreset}
                  className="px-5 py-2 text-xs font-bold text-white bg-darkblue hover:bg-blue-900 rounded-xl shadow-xs"
                >
                  {savingPreset ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
