import React, { useState, useEffect } from 'react';
import { formatDateTimeDDMMMYYYY } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { LogoImage } from '../components/LogoImage';
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
  LogIn,
  Check,
  Plus,
  Edit2,
  Bookmark,
  Save,
  X,
  FileText,
  SlidersHorizontal
} from 'lucide-react';

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
  const { user } = useAuth();
  const isSecretary = user?.role === 'Secretary';

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [presets, setPresets] = useState<AnnouncementPresetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPresets, setLoadingPresets] = useState(false);

  // Form State
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

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Preset Template Modal & Management State
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
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => {
        setAnnouncements(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadPresets = () => {
    setLoadingPresets(true);
    fetch('/api/announcements/presets')
      .then((res) => res.json())
      .then((data) => {
        setPresets(Array.isArray(data) ? data : []);
        setLoadingPresets(false);
      })
      .catch(() => setLoadingPresets(false));
  };

  useEffect(() => {
    if (isSecretary) {
      loadAnnouncements();
      loadPresets();
      fetch('/api/members')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setMembers(data);
        })
        .catch(() => {});
    }
  }, [isSecretary]);

  // Apply quick preset template to draft
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

  // Open Create Preset modal with current draft or fresh
  const handleOpenCreatePresetModal = (fromCurrentDraft = false) => {
    setEditingPreset(null);
    if (fromCurrentDraft) {
      setPresetFormName(title ? `${title.slice(0, 24)}...` : 'Custom Preset');
      setPresetFormTitle(title);
      setPresetFormCategory(category);
      setPresetFormAudience(targetAudience);
      const currentChannels: ('Email' | 'Telegram' | 'InApp')[] = [];
      if (sendEmailChannel) currentChannels.push('Email');
      if (sendTelegramChannel) currentChannels.push('Telegram');
      if (sendInAppChannel) currentChannels.push('InApp');
      setPresetFormChannels(currentChannels.length > 0 ? currentChannels : ['Email', 'Telegram', 'InApp']);
      setPresetFormMessage(message);
      setPresetFormActionUrl(actionUrl);
      setPresetFormActionText(actionText);
    } else {
      setPresetFormName('');
      setPresetFormTitle('');
      setPresetFormCategory('General');
      setPresetFormAudience('All');
      setPresetFormChannels(['Email', 'Telegram', 'InApp']);
      setPresetFormMessage('');
      setPresetFormActionUrl('');
      setPresetFormActionText('View Details');
    }
    setIsPresetModalOpen(true);
  };

  // Open Edit Preset modal
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

  // Save Preset Template (Create or Update)
  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetFormName.trim() || !presetFormTitle.trim() || !presetFormMessage.trim()) {
      alert('Please provide a preset name, announcement headline, and message body.');
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

      const res = await fetch(url, {
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
        alert(data.error || 'Failed to save preset template.');
      }
    } catch (err: any) {
      setSavingPreset(false);
      alert(err.message || 'Error communicating with server.');
    }
  };

  // Delete Preset Template
  const handleDeletePreset = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete the preset template "${name}"?`)) return;

    try {
      const res = await fetch(`/api/announcements/presets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setPresets(data.presets || []);
        if (activeAppliedPresetId === id) setActiveAppliedPresetId(null);
      } else {
        alert(data.error || 'Failed to delete preset template.');
      }
    } catch {
      alert('Failed to delete preset template.');
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please provide both a title and announcement message.');
      return;
    }

    if (targetAudience === 'Specific' && targetMemberIds.length === 0) {
      alert('Please select at least one specific member to receive this announcement.');
      return;
    }

    const channels: ('Email' | 'Telegram' | 'InApp')[] = [];
    if (sendEmailChannel) channels.push('Email');
    if (sendTelegramChannel) channels.push('Telegram');
    if (sendInAppChannel) channels.push('InApp');

    if (channels.length === 0) {
      alert('Please select at least one dispatch channel (Email, Telegram, or In-App).');
      return;
    }

    if (!confirm(`Are you ready to broadcast "${title}" to ${channels.join(' + ')} on behalf of the Secretary of Arabiyya Rover Council?`)) {
      return;
    }

    setDispatching(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/announcements', {
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
          dispatchedBy: user?.fullName || 'Ahmed Nazih Nafiz'
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement record?')) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAnnouncements();
      }
    } catch {
      alert('Failed to delete announcement.');
    }
  };

  // If user is not Secretary or Admin, show Access Restricted screen
  if (!isSecretary) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center p-3 mx-auto text-maroon">
            <Megaphone className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-maroon">Role Restricted</div>
            <h1 className="text-2xl font-bold text-darkblue">Secretary Announcements Portal</h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              This channel dispatch suite is restricted to the <strong>Secretary of Arabiyya Rover Council</strong> and designated council administrators for official broadcasts.
            </p>
          </div>
          <div className="pt-2 flex flex-col space-y-3">
            <button
              onClick={() => onNavigate('/dashboard')}
              className="w-full py-3 bg-darkblue hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredAnnouncements = announcements.filter((a) => {
    const matchCat = filterCategory === 'All' || a.category === filterCategory;
    const matchSearch =
      !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const secName = user?.fullName || 'Ahmed Nazih Nafiz';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center space-x-2 text-maroon font-bold text-xs uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" />
            <span>Secretary Dispatch Center</span>
          </div>
          <h1 className="text-2xl font-bold text-darkblue">Official Announcements</h1>
          <p className="text-xs text-gray-500 mt-1">
            Create custom notices and broadcast seamlessly across <strong>Email</strong>, <strong>Telegram Channel</strong>, and <strong>In-App Banners</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('/settings')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-darkblue text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <span>Telegram & SMTP Settings</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-start space-x-3 shadow-xs ${
            feedback.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-red-50 border-red-200 text-red-950'
          }`}
        >
          {feedback.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <p className="font-bold">{feedback.message}</p>
            {feedback.details && (
              <div className="text-[11px] text-gray-600 flex flex-wrap gap-3 pt-1">
                {feedback.details.emailCount !== undefined && (
                  <span>✉️ Emails sent: <strong>{feedback.details.emailCount}</strong></span>
                )}
                {feedback.details.telegramStatus && (
                  <span>✈️ Telegram: <strong>{feedback.details.telegramStatus}</strong></span>
                )}
                {feedback.details.inAppActive && (
                  <span>📢 In-App Banner: <strong>Active</strong></span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Creation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Announcement Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-maroon" />
              <h2 className="text-base font-bold text-darkblue">Draft New Announcement</h2>
            </div>
            <div className="text-xs text-gray-400">
              Sender: <strong className="text-darkblue">{secName}</strong>
            </div>
          </div>

          {/* Quick Preset Templates Section with CRUD */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-4 h-4 text-maroon" />
                <label className="text-xs font-bold text-darkblue uppercase tracking-wider">
                  Quick Preset Templates ({presets.length})
                </label>
              </div>
              <div className="flex items-center space-x-2">
                {title && message && (
                  <button
                    type="button"
                    onClick={() => handleOpenCreatePresetModal(true)}
                    className="px-2.5 py-1 text-[11px] font-bold text-darkblue bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors flex items-center space-x-1"
                    title="Save current draft form as a reusable preset template"
                  >
                    <Save className="w-3.5 h-3.5 text-maroon" />
                    <span>Save Draft as Preset</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenCreatePresetModal(false)}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-darkblue hover:bg-blue-900 rounded-lg transition-colors flex items-center space-x-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Template</span>
                </button>
              </div>
            </div>

            {loadingPresets ? (
              <div className="text-xs text-gray-400 py-2">Loading presets...</div>
            ) : presets.length === 0 ? (
              <div className="text-center py-4 bg-white rounded-xl border border-dashed border-gray-300 text-xs text-gray-500">
                No preset templates yet. Click <strong>New Template</strong> or <strong>Save Draft as Preset</strong> to create one!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {presets.map((p) => {
                  const isApplied = activeAppliedPresetId === p.id;
                  const categoryBadgeColor =
                    p.category === 'Urgent'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : p.category === 'Investiture'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : p.category === 'Training'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : p.category === 'Event'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200';

                  return (
                    <div
                      key={p.id}
                      onClick={() => applyPresetTemplate(p)}
                      className={`group relative p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                        isApplied
                          ? 'bg-blue-50/90 border-darkblue shadow-xs ring-1 ring-darkblue'
                          : 'bg-white hover:bg-slate-50/90 border-gray-200 hover:border-darkblue/40 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${categoryBadgeColor}`}
                          >
                            {p.category}
                          </span>
                          
                          {/* Actions: Edit & Delete */}
                          <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditPresetModal(p, e)}
                              className="p-1 text-gray-400 hover:text-darkblue hover:bg-slate-100 rounded-md transition-colors"
                              title="Edit preset template"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeletePreset(p.id, p.name, e)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete preset template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-darkblue line-clamp-1 mb-1">{p.name}</h4>
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{p.message}</p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-gray-100/80 flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 font-medium">Audience: <strong className="text-gray-600">{p.targetAudience || 'All'}</strong></span>
                        <span className={`font-bold transition-colors ${isApplied ? 'text-maroon' : 'text-darkblue group-hover:text-maroon'}`}>
                          {isApplied ? '✓ Applied' : 'Apply Draft →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleDispatch} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Announcement Headline / Subject *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Schedule Update for Saturday Field Exercise..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon text-darkblue"
              />
            </div>

            {/* Category & Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-maroon" />
                  <span>Category *</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-maroon"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} Notice
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-darkblue" />
                  <span>Target Audience *</span>
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-maroon"
                >
                  {AUDIENCES.map((aud) => (
                    <option key={aud.id} value={aud.id}>
                      {aud.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {targetAudience === 'Specific' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-darkblue uppercase tracking-wider">Select Recipients</span>
                  <span className="text-[11px] font-bold text-maroon bg-maroon/5 px-2.5 py-1 rounded-full">
                    {targetMemberIds.length} Selected
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Search members by name, city, or ID card..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-maroon focus:border-maroon"
                />

                <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100">
                  {members
                    .filter((m) => {
                      const query = memberSearchQuery.toLowerCase().trim();
                      if (!query) return true;
                      return (
                        m.fullName?.toLowerCase().includes(query) ||
                        m.idCardNumber?.toLowerCase().includes(query) ||
                        m.city?.toLowerCase().includes(query) ||
                        m.role?.toLowerCase().includes(query)
                      );
                    })
                    .map((m) => {
                      const isChecked = targetMemberIds.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className="flex items-start p-2.5 hover:bg-slate-50 cursor-pointer select-none space-x-2.5 text-xs transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setTargetMemberIds(targetMemberIds.filter((id) => id !== m.id));
                              } else {
                                setTargetMemberIds([...targetMemberIds, m.id]);
                              }
                            }}
                            className="rounded text-maroon focus:ring-maroon mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-darkblue truncate">{m.fullName}</div>
                            <div className="text-[10px] text-gray-500 flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 font-semibold">
                              <span>ID: <strong className="text-gray-700">{m.idCardNumber || 'N/A'}</strong></span>
                              <span>•</span>
                              <span>Role: <strong className="text-maroon">{m.role || 'Rover'}</strong></span>
                              {m.city && (
                                <>
                                  <span>•</span>
                                  <span>City: <strong className="text-gray-700">{m.city}</strong></span>
                                </>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  {members.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">
                      No registered members found.
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = members.filter((m) => {
                        const query = memberSearchQuery.toLowerCase().trim();
                        if (!query) return true;
                        return (
                          m.fullName?.toLowerCase().includes(query) ||
                          m.idCardNumber?.toLowerCase().includes(query) ||
                          m.city?.toLowerCase().includes(query) ||
                          m.role?.toLowerCase().includes(query)
                        );
                      });
                      const filteredIds = filtered.map((m) => m.id);
                      setTargetMemberIds(Array.from(new Set([...targetMemberIds, ...filteredIds])));
                    }}
                    className="text-darkblue hover:underline font-bold"
                  >
                    Select All Matches
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMemberIds([])}
                    className="text-red-600 hover:underline font-bold"
                  >
                    Clear Selections
                  </button>
                </div>
              </div>
            )}

            {/* Dispatch Channels */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Trigger to Channels *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                <label
                  className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                    sendEmailChannel
                      ? 'bg-blue-50/70 border-darkblue text-darkblue font-bold shadow-2xs'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sendEmailChannel}
                    onChange={(e) => setSendEmailChannel(e.target.checked)}
                    className="rounded text-darkblue focus:ring-darkblue"
                  />
                  <div className="flex items-center space-x-2 text-xs">
                    <Mail className="w-4 h-4 text-maroon" />
                    <span>Email Broadcast</span>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                    sendTelegramChannel
                      ? 'bg-sky-50/70 border-sky-600 text-sky-950 font-bold shadow-2xs'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sendTelegramChannel}
                    onChange={(e) => setSendTelegramChannel(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-600"
                  />
                  <div className="flex items-center space-x-2 text-xs">
                    <Send className="w-4 h-4 text-sky-600" />
                    <span>Telegram Group</span>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                    sendInAppChannel
                      ? 'bg-purple-50/70 border-purple-600 text-purple-950 font-bold shadow-2xs'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sendInAppChannel}
                    onChange={(e) => setSendInAppChannel(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-600"
                  />
                  <div className="flex items-center space-x-2 text-xs">
                    <Radio className="w-4 h-4 text-purple-600" />
                    <span>In-App Banner</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Announcement Message */}
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

            {/* Optional Action URL & Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Optional Action Link (URL or App Path)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /events, /attendance, or https://..."
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Action Button Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. View Schedule, RSVP Now"
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={dispatching || !title.trim() || !message.trim()}
                className="w-full py-3 bg-maroon hover:bg-[#660000] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {dispatching
                    ? 'Broadcasting Announcement...'
                    : 'Dispatch Official Announcement'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Multi-Channel Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-darkblue" />
                <h3 className="text-xs font-bold text-darkblue uppercase tracking-wider">
                  Live Dispatch Preview
                </h3>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewTab('email')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    previewTab === 'email'
                      ? 'bg-white text-darkblue shadow-2xs'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✉️ Email
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('telegram')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    previewTab === 'telegram'
                      ? 'bg-white text-sky-700 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✈️ Telegram
                </button>
              </div>
            </div>

            {/* Email Preview Layout */}
            {previewTab === 'email' ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-slate-50 text-xs">
                <div className="bg-[#800000] text-white p-4 text-center">
                  <div className="w-10 h-10 bg-white rounded-full p-1 mx-auto mb-2 flex items-center justify-center">
                    <LogoImage className="w-full h-full object-contain" />
                  </div>
                  <div className="font-bold text-sm">Arabiyya Members</div>
                  <div className="text-[10px] text-amber-200">Arabiyya Rover Network</div>
                </div>

                <div className="p-4 bg-white space-y-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      category === 'Urgent'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {category} Notice
                  </span>

                  <h4 className="font-bold text-sm text-darkblue">
                    {title || 'Announcement Headline Here...'}
                  </h4>

                  <div className="text-gray-700 text-[11px] whitespace-pre-line leading-relaxed border-l-2 border-slate-200 pl-3">
                    {message || 'Your announcement text will be formatted here with Scout greetings and official attribution.'}
                  </div>

                  {actionUrl && (
                    <div className="text-center py-2">
                      <span className="inline-block px-4 py-2 bg-maroon text-white font-bold text-[11px] rounded-lg">
                        {actionText || 'View in Portal'}
                      </span>
                    </div>
                  )}

                  {/* Signature */}
                  <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-600">
                    <p className="italic mb-1">Yours in Scouting,</p>
                    <p className="font-bold text-darkblue">{secName}</p>
                    <p className="text-[10px] text-gray-500">Secretary of Arabiyya Rover Council</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Telegram Preview Layout */
              <div className="bg-[#0e1621] text-white p-4 rounded-xl text-xs space-y-3 font-sans shadow-inner">
                <div className="flex items-center space-x-2 text-sky-400 font-bold text-[11px]">
                  <span>⚜️ Arabiyya Rovers Official Channel</span>
                </div>

                <div className="bg-[#182533] p-3.5 rounded-2xl space-y-2 border border-sky-950/40">
                  <div className="font-bold text-sky-300 text-[11px]">
                    [{category.toUpperCase()}] {title || 'Headline Preview'}
                  </div>

                  <div className="text-gray-200 text-[11px] whitespace-pre-line leading-relaxed">
                    {message || 'Announcement body for Telegram channel broadcast...'}
                  </div>

                  {actionUrl && (
                    <div className="pt-1">
                      <span className="text-sky-400 underline text-[10px] flex items-center space-x-1">
                        <ExternalLink className="w-3 h-3" />
                        <span>{actionUrl}</span>
                      </span>
                    </div>
                  )}

                  <div className="pt-2 text-[10px] text-gray-400 border-t border-slate-700/50">
                    <div>—</div>
                    <div>Yours in Scouting,</div>
                    <div className="font-bold text-white">{secName}</div>
                    <div className="text-sky-400">Secretary of Arabiyya Rover Council</div>
                    <div className="text-slate-500 text-[9px]">#ArabiyyaRovers</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Broadcast Strategy Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-darkblue space-y-2">
            <div className="font-bold flex items-center space-x-1.5">
              <Radio className="w-4 h-4 text-maroon" />
              <span>Multi-Channel Dispatch Protocol</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              When dispatched, the system dynamically filters recipients according to your selected Target Audience and initiates asynchronous email queuing, instant Telegram API message pushing, and database persistence.
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast History & Logs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-gray-50/50">
          <div>
            <h2 className="text-sm font-bold text-darkblue">Dispatched Announcements Log</h2>
            <p className="text-xs text-gray-500">History of official announcements and multi-channel broadcast records</p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-xl bg-white font-medium"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

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
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-500">
            No announcements found. Use the draft box above to dispatch your first announcement.
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
                {filteredAnnouncements.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            item.category === 'Urgent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
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
                      {formatDateTimeDDMMMYYYY(item.dispatchedAt)}
                    </td>

                    <td className="px-4 py-3 text-darkblue font-semibold text-[11px]">
                      {item.dispatchedBy}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete announcement record"
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

      {/* Preset Template Creation / Edit Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-darkblue flex items-center justify-center font-bold">
                  <Bookmark className="w-4 h-4 text-maroon" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-darkblue">
                    {editingPreset ? 'Edit Preset Template' : 'Create Preset Template'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Save reusable drafts for quick 1-click announcement authoring.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPresetModalOpen(false);
                  setEditingPreset(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-4">
              {/* Template Label / Identifier */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Preset Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Council Assembly, Weekend Hike Alert, Investiture Muster"
                  value={presetFormName}
                  onChange={(e) => setPresetFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon font-semibold text-darkblue"
                />
              </div>

              {/* Subject Headline */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Announcement Headline / Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Council Assembly & General Muster..."
                  value={presetFormTitle}
                  onChange={(e) => setPresetFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon font-medium"
                />
              </div>

              {/* Category & Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={presetFormCategory}
                    onChange={(e) => setPresetFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-maroon"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} Notice
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Default Audience *
                  </label>
                  <select
                    value={presetFormAudience}
                    onChange={(e) => setPresetFormAudience(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-maroon"
                  >
                    {AUDIENCES.map((aud) => (
                      <option key={aud.id} value={aud.id}>
                        {aud.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Default Channels */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Default Broadcast Channels
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Email', 'Telegram', 'InApp'] as const).map((channel) => {
                    const active = presetFormChannels.includes(channel);
                    return (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => {
                          if (active) {
                            setPresetFormChannels(presetFormChannels.filter((c) => c !== channel));
                          } else {
                            setPresetFormChannels([...presetFormChannels, channel]);
                          }
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all ${
                          active
                            ? 'bg-blue-50 border-darkblue text-darkblue shadow-2xs'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {channel === 'Email' && '✉️ Email'}
                        {channel === 'Telegram' && '✈️ Telegram'}
                        {channel === 'InApp' && '📢 In-App'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Preset Announcement Body *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Template message text with greeting, key details, and requirements..."
                  value={presetFormMessage}
                  onChange={(e) => setPresetFormMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon leading-relaxed"
                />
              </div>

              {/* Action Link & Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Action Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="/events, /policy, etc."
                    value={presetFormActionUrl}
                    onChange={(e) => setPresetFormActionUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Action Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. View Schedule"
                    value={presetFormActionText}
                    onChange={(e) => setPresetFormActionText(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsPresetModalOpen(false);
                    setEditingPreset(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPreset}
                  className="px-5 py-2 text-xs font-bold text-white bg-darkblue hover:bg-blue-900 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingPreset ? 'Saving...' : editingPreset ? 'Update Template' : 'Save Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

