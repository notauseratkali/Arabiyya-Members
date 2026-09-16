import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogBookEntry, LogBookCategory, LogBookStatus } from '../types';
import { formatDateDDMMMYYYY } from '../utils/dateUtils';
import {
  BookMarked,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  Compass,
  Tent,
  Award,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FileEdit,
  Trash2,
  Eye,
  X,
  Send,
  Printer,
  ChevronRight,
  Sparkles,
  Users,
  ShieldCheck,
  Image as ImageIcon,
  Check,
  RefreshCw,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface LogBookPageProps {
  onNavigate: (path: string) => void;
}

const CATEGORY_CONFIG: Record<LogBookCategory, { label: string; icon: any; color: string; bg: string; border: string }> = {
  Camp: { label: 'Camp & Expedition', icon: Tent, color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
  Hike: { label: 'Hike & Trekking', icon: Compass, color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Service: { label: 'Community Service', icon: Award, color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  Training: { label: 'Training & Skills', icon: Sparkles, color: 'text-purple-800', bg: 'bg-purple-50', border: 'border-purple-200' },
  Meeting: { label: 'Meeting & Council', icon: Users, color: 'text-slate-800', bg: 'bg-slate-100', border: 'border-slate-300' },
  Milestone: { label: 'Milestone & Badge', icon: ShieldCheck, color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200' },
  Other: { label: 'Other Activity', icon: BookMarked, color: 'text-gray-800', bg: 'bg-gray-100', border: 'border-gray-300' }
};

const STATUS_CONFIG: Record<LogBookStatus, { label: string; icon: any; color: string; bg: string; border: string }> = {
  Verified: { label: 'Verified', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Pending Review': { label: 'Pending Review', icon: Clock3, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Draft: { label: 'Draft', icon: FileEdit, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  'Needs Revision': { label: 'Needs Revision', icon: AlertCircle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' }
};

export const LogBookPage: React.FC<LogBookPageProps> = ({ onNavigate }) => {
  const { user, isSecretary } = useAuth();
  const isAdminOrLeader = isSecretary || user?.role === 'Admin' || user?.role === 'Leader' || user?.isAdmin;

  // View Mode: 'my' (Personal logbook) vs 'crew' (Leader verification queue)
  const [viewTab, setViewTab] = useState<'my' | 'crew'>('my');

  // Entries and Stats
  const [entries, setEntries] = useState<LogBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEntries: 0,
    verifiedEntries: 0,
    pendingReview: 0,
    drafts: 0,
    totalHours: 0,
    totalHikingKm: 0,
    totalCampNights: 0
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogBookEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<LogBookEntry | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingEntry, setReviewingEntry] = useState<LogBookEntry | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<LogBookCategory>('Camp');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDurationHours, setFormDurationHours] = useState<string>('');
  const [formHikingKm, setFormHikingKm] = useState<string>('');
  const [formCampNights, setFormCampNights] = useState<string>('');
  const [formRoleInActivity, setFormRoleInActivity] = useState('Participant');
  const [formDescription, setFormDescription] = useState('');
  const [formLearningPoints, setFormLearningPoints] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formStatus, setFormStatus] = useState<LogBookStatus>('Pending Review');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Review Form
  const [reviewStatus, setReviewStatus] = useState<'Verified' | 'Needs Revision'>('Verified');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Fetch log entries
  const fetchEntries = async () => {
    setLoading(true);
    try {
      let url = '/api/logbook';
      const params = new URLSearchParams();

      if (viewTab === 'my' && user?.id) {
        params.append('memberId', user.id);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const [res, statsRes] = await Promise.all([
        fetch(url).then(r => r.json()),
        fetch(user?.id && viewTab === 'my' ? `/api/logbook/stats?memberId=${user.id}` : '/api/logbook/stats').then(r => r.json())
      ]);

      if (Array.isArray(res)) {
        setEntries(res);
      }
      if (statsRes && !statsRes.error) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Failed to load log book entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user, viewTab]);

  // Open creation modal
  const handleOpenCreateModal = () => {
    setEditingEntry(null);
    setFormTitle('');
    setFormCategory('Camp');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormLocation('');
    setFormDurationHours('');
    setFormHikingKm('');
    setFormCampNights('');
    setFormRoleInActivity('Participant');
    setFormDescription('');
    setFormLearningPoints('');
    setFormPhotoUrl('');
    setFormStatus('Pending Review');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (entry: LogBookEntry) => {
    setEditingEntry(entry);
    setFormTitle(entry.title || '');
    setFormCategory(entry.category || 'Camp');
    setFormDate(entry.date || new Date().toISOString().split('T')[0]);
    setFormEndDate(entry.endDate || '');
    setFormLocation(entry.location || '');
    setFormDurationHours(entry.durationHours ? String(entry.durationHours) : '');
    setFormHikingKm(entry.hikingKm ? String(entry.hikingKm) : '');
    setFormCampNights(entry.campNights ? String(entry.campNights) : '');
    setFormRoleInActivity(entry.roleInActivity || 'Participant');
    setFormDescription(entry.description || '');
    setFormLearningPoints(entry.learningPoints || '');
    setFormPhotoUrl(entry.photoUrls && entry.photoUrls.length > 0 ? entry.photoUrls[0] : '');
    setFormStatus(entry.status || 'Pending Review');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Activity title is required.');
      return;
    }
    if (!formDate) {
      setFormError('Date is required.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      memberId: editingEntry ? editingEntry.memberId : (user?.id || 'unknown'),
      memberName: editingEntry ? editingEntry.memberName : (user?.fullName || user?.commonName || 'Scout Member'),
      memberRole: editingEntry ? editingEntry.memberRole : (user?.role || 'Rover'),
      title: formTitle.trim(),
      category: formCategory,
      date: formDate,
      endDate: formEndDate,
      location: formLocation.trim(),
      durationHours: formDurationHours ? parseFloat(formDurationHours) : 0,
      hikingKm: formHikingKm ? parseFloat(formHikingKm) : 0,
      campNights: formCampNights ? parseInt(formCampNights, 10) : 0,
      roleInActivity: formRoleInActivity.trim(),
      description: formDescription.trim(),
      learningPoints: formLearningPoints.trim(),
      photoUrls: formPhotoUrl.trim() ? [formPhotoUrl.trim()] : [],
      status: formStatus
    };

    try {
      let res;
      if (editingEntry) {
        res = await fetch(`/api/logbook/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/logbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save log entry');
      }

      setIsFormModalOpen(false);
      fetchEntries();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Entry
  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this log book entry?')) {
      return;
    }

    try {
      const res = await fetch(`/api/logbook/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (viewingEntry?.id === id) setViewingEntry(null);
        fetchEntries();
      }
    } catch (err) {
      console.error('Failed to delete log entry:', err);
    }
  };

  // Open review modal
  const handleOpenReviewModal = (entry: LogBookEntry) => {
    setReviewingEntry(entry);
    setReviewStatus(entry.status === 'Needs Revision' ? 'Needs Revision' : 'Verified');
    setReviewNotes(entry.reviewNotes || '');
    setIsReviewModalOpen(true);
  };

  // Submit Leader Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingEntry) return;

    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/logbook/${reviewingEntry.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          reviewNotes: reviewNotes.trim(),
          reviewedBy: user?.fullName || user?.commonName || 'Scout Leader'
        })
      });

      if (res.ok) {
        setIsReviewModalOpen(false);
        setReviewingEntry(null);
        fetchEntries();
      }
    } catch (err) {
      console.error('Failed to review log entry:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Category filter
      if (selectedCategory !== 'All' && entry.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'All' && entry.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = entry.title?.toLowerCase().includes(q);
        const matchLoc = entry.location?.toLowerCase().includes(q);
        const matchDesc = entry.description?.toLowerCase().includes(q);
        const matchMember = entry.memberName?.toLowerCase().includes(q);
        const matchLearnings = entry.learningPoints?.toLowerCase().includes(q);
        return matchTitle || matchLoc || matchDesc || matchMember || matchLearnings;
      }
      return true;
    });
  }, [entries, selectedCategory, selectedStatus, searchQuery]);

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-200/80 shadow-xs">
            <BookMarked className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-darkblue tracking-tight">Scout Log Book</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Rover Passport
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Record camps, treks, community service hours, skill accomplishments, and badge milestones.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-2xs hover:border-gray-300"
            title="Print Official Log Book"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>Print Portfolio</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-darkblue hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Log Entry</span>
          </button>
        </div>
      </div>

      {/* Role View Tabs (for Leaders/Admins) */}
      {isAdminOrLeader && (
        <div className="flex items-center space-x-1.5 p-1 bg-gray-100/90 rounded-2xl max-w-fit mb-6 border border-gray-200/80">
          <button
            onClick={() => setViewTab('my')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              viewTab === 'my'
                ? 'bg-white text-darkblue shadow-xs'
                : 'text-gray-600 hover:text-darkblue'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>My Personal Log Book</span>
          </button>

          <button
            onClick={() => setViewTab('crew')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              viewTab === 'crew'
                ? 'bg-white text-darkblue shadow-xs'
                : 'text-gray-600 hover:text-darkblue'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Crew Verification Queue</span>
            {stats.pendingReview > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {stats.pendingReview}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Log Book Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Entries</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-darkblue">{stats.totalEntries}</span>
            <span className="text-[11px] font-bold text-emerald-600">
              {stats.verifiedEntries} verified
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Service Hours</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-darkblue">{stats.totalHours}</span>
            <span className="text-xs font-bold text-gray-500">hours</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Hike Distance</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-darkblue">{stats.totalHikingKm}</span>
            <span className="text-xs font-bold text-gray-500">km trekked</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Camp Nights</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Tent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-darkblue">{stats.totalCampNights}</span>
            <span className="text-xs font-bold text-gray-500">nights in camp</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs mb-6 space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by activity name, location, skill or note..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Draft">Draft</option>
              <option value="Needs Revision">Needs Revision</option>
            </select>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-400 mr-1 flex items-center space-x-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>

          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
              selectedCategory === 'All'
                ? 'bg-darkblue text-white border-darkblue shadow-2xs'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            All Categories ({entries.length})
          </button>

          {(Object.keys(CATEGORY_CONFIG) as LogBookCategory[]).map(catKey => {
            const cfg = CATEGORY_CONFIG[catKey];
            const Icon = cfg.icon;
            const count = entries.filter(e => e.category === catKey).length;
            const isSelected = selectedCategory === catKey;

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isSelected
                    ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-darkblue/20 shadow-2xs`
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-darkblue mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-500">Loading scout log book...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
              <BookMarked className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-darkblue">No Log Entries Found</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All'
                  ? 'No entries matched your filter criteria. Try resetting filters or search query.'
                  : 'Start your rover passport by logging your recent scout camps, hikes, community good turns, or training sessions.'}
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-darkblue text-white text-xs font-bold shadow-xs hover:bg-blue-900 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Activity</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredEntries.map(entry => {
            const catCfg = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.Other;
            const statusCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.Draft;
            const CatIcon = catCfg.icon;
            const StatusIcon = statusCfg.icon;

            const isAuthor = user?.id === entry.memberId;

            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start space-x-4">
                    <div className={`w-11 h-11 rounded-2xl ${catCfg.bg} ${catCfg.color} flex items-center justify-center shrink-0 border ${catCfg.border} shadow-2xs`}>
                      <CatIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${catCfg.bg} ${catCfg.color} ${catCfg.border}`}>
                          {catCfg.label}
                        </span>

                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusCfg.label}</span>
                        </span>

                        {viewTab === 'crew' && (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold">
                            By {entry.memberName} ({entry.memberRole || 'Rover'})
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-darkblue group-hover:text-blue-900 transition-colors">
                        {entry.title}
                      </h3>

                      {/* Meta Pills */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium pt-0.5">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {formatDateDDMMMYYYY(entry.date)}
                            {entry.endDate && entry.endDate !== entry.date && ` - ${formatDateDDMMMYYYY(entry.endDate)}`}
                          </span>
                        </div>

                        {entry.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{entry.location}</span>
                          </div>
                        )}

                        {entry.roleInActivity && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span>Role: {entry.roleInActivity}</span>
                          </div>
                        )}

                        {entry.durationHours ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-100">
                            ⏱️ {entry.durationHours} hrs
                          </span>
                        ) : null}

                        {entry.hikingKm ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-100">
                            🥾 {entry.hikingKm} km
                          </span>
                        ) : null}

                        {entry.campNights ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-100">
                            🏕️ {entry.campNights} night{entry.campNights > 1 ? 's' : ''}
                          </span>
                        ) : null}
                      </div>

                      {/* Short Description Preview */}
                      {entry.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 pt-1 leading-relaxed">
                          {entry.description}
                        </p>
                      )}

                      {/* Supervisor Review Feedback Note if verified or needs revision */}
                      {entry.reviewNotes && (
                        <div className="mt-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 flex items-start space-x-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-darkblue">Leader Remarks ({entry.reviewedBy}): </span>
                            <span>{entry.reviewNotes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 w-full lg:w-auto justify-end">
                    <button
                      onClick={() => setViewingEntry(entry)}
                      className="p-2 rounded-xl text-gray-500 hover:text-darkblue hover:bg-gray-100 transition-all"
                      title="View Log Narrative"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {isAdminOrLeader && (
                      <button
                        onClick={() => handleOpenReviewModal(entry)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all"
                        title="Review / Sign Off Log Entry"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    )}

                    {(isAuthor || isAdminOrLeader) && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(entry)}
                          className="p-2 rounded-xl text-gray-500 hover:text-darkblue hover:bg-gray-100 transition-all"
                          title="Edit Entry"
                        >
                          <FileEdit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. VIEW ENTRY DETAIL MODAL */}
      {/* ======================================================== */}
      {viewingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <BookMarked className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-darkblue">{viewingEntry.title}</h3>
                  <span className="text-xs text-gray-500">
                    Logged by {viewingEntry.memberName} ({viewingEntry.memberRole || 'Rover'})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingEntry(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Category</span>
                <span className="text-xs font-bold text-darkblue mt-0.5 block">{viewingEntry.category}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Date</span>
                <span className="text-xs font-bold text-darkblue mt-0.5 block">{formatDateDDMMMYYYY(viewingEntry.date)}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Location</span>
                <span className="text-xs font-bold text-darkblue mt-0.5 block">{viewingEntry.location || 'N/A'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Role</span>
                <span className="text-xs font-bold text-darkblue mt-0.5 block">{viewingEntry.roleInActivity || 'Participant'}</span>
              </div>
            </div>

            {/* Detailed Narrative */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Activity Description & Experience</h4>
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                {viewingEntry.description || 'No detailed log description provided.'}
              </div>
            </div>

            {/* Learnings */}
            {viewingEntry.learningPoints && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Skills Demonstrated & Key Takeaways</h4>
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-emerald-950 leading-relaxed whitespace-pre-wrap">
                  {viewingEntry.learningPoints}
                </div>
              </div>
            )}

            {/* Attached Photo */}
            {viewingEntry.photoUrls && viewingEntry.photoUrls.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Attached Photo & Media</h4>
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xs max-h-72">
                  <img
                    src={viewingEntry.photoUrls[0]}
                    alt="Activity Media"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            )}

            {/* Review Status & Feedback */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-darkblue">Verification Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${STATUS_CONFIG[viewingEntry.status]?.bg} ${STATUS_CONFIG[viewingEntry.status]?.color} ${STATUS_CONFIG[viewingEntry.status]?.border}`}>
                    {viewingEntry.status}
                  </span>
                </div>
                {viewingEntry.reviewedAt && (
                  <span className="text-[11px] text-gray-400">
                    Reviewed on {formatDateDDMMMYYYY(viewingEntry.reviewedAt)}
                  </span>
                )}
              </div>

              {viewingEntry.reviewedBy && (
                <p className="text-xs text-gray-600">
                  <span className="font-bold">Reviewed By:</span> {viewingEntry.reviewedBy}
                </p>
              )}

              {viewingEntry.reviewNotes && (
                <div className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="font-bold block text-darkblue mb-1">Leader Notes:</span>
                  {viewingEntry.reviewNotes}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingEntry(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ADD / EDIT LOG ENTRY MODAL */}
      {/* ======================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-darkblue text-white flex items-center justify-center shadow-xs">
                  {editingEntry ? <FileEdit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-darkblue">
                    {editingEntry ? 'Edit Log Book Entry' : 'New Scout Log Entry'}
                  </h3>
                  <p className="text-xs text-gray-500">Record your scout activities, hikes, campings, or community service.</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEntry} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-1.5">
                  Activity / Event Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual Rover Island Expedition, Rasfannu Beach Cleanup"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
                  required
                />
              </div>

              {/* Category & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as LogBookCategory)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
                  >
                    <option value="Camp">🏕️ Camp & Expedition</option>
                    <option value="Hike">🥾 Hike & Trekking</option>
                    <option value="Service">🤝 Community Service / Good Turn</option>
                    <option value="Training">🎖️ Training & Skill Workshop</option>
                    <option value="Meeting">🚩 Meeting & Council Assembly</option>
                    <option value="Milestone">📜 Milestone & Badge Achievement</option>
                    <option value="Other">🌐 Other Scouting Activity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-1.5">
                    Role in Activity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Participant, Patrol Leader, Quartermaster"
                    value={formRoleInActivity}
                    onChange={e => setFormRoleInActivity(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
                  />
                </div>
              </div>

              {/* Dates & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-1.5">
                    End Date (If Multi-Day)
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-1.5">
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hulhumale Phase 2 Beach"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
                  />
                </div>
              </div>

              {/* Quantitative Metrics */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-3">
                <span className="text-xs font-bold text-darkblue block">Quantitative Rover Milestones (Optional)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Service Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 4.5"
                      value={formDurationHours}
                      onChange={e => setFormDurationHours(e.target.value)}
                      className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-darkblue/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Hike Dist (Km)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 12"
                      value={formHikingKm}
                      onChange={e => setFormHikingKm(e.target.value)}
                      className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-darkblue/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Camp Nights</label>
                    <input
                      type="number"
                      placeholder="e.g. 2"
                      value={formCampNights}
                      onChange={e => setFormCampNights(e.target.value)}
                      className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-darkblue/20"
                    />
                  </div>
                </div>
              </div>

              {/* Narrative Description */}
              <div>
                <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-1.5">
                  Detailed Log Narrative & Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the activity, schedule, key tasks performed, weather conditions, and personal reflections..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
                />
              </div>

              {/* Key Learnings & Skills */}
              <div>
                <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-1.5">
                  Skills Learned & Takeaways
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pioneering knots, compass bearings, team coordination under pressure"
                  value={formLearningPoints}
                  onChange={e => setFormLearningPoints(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
                />
              </div>

              {/* Media URL / Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-1.5">
                  Photo / Certificate Image URL or Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste image URL (https://...)"
                    value={formPhotoUrl}
                    onChange={e => setFormPhotoUrl(e.target.value)}
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer transition-all flex items-center space-x-1.5 shrink-0">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {formPhotoUrl && (
                  <div className="mt-2.5 relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                    <img src={formPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormPhotoUrl('')}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Status selection */}
              <div>
                <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-1.5">
                  Submission Status
                </label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center space-x-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Pending Review"
                      checked={formStatus === 'Pending Review'}
                      onChange={() => setFormStatus('Pending Review')}
                      className="text-darkblue focus:ring-darkblue"
                    />
                    <span>Submit for Leader Review</span>
                  </label>

                  <label className="inline-flex items-center space-x-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Draft"
                      checked={formStatus === 'Draft'}
                      onChange={() => setFormStatus('Draft')}
                      className="text-darkblue focus:ring-darkblue"
                    />
                    <span>Save as Draft</span>
                  </label>

                  {isAdminOrLeader && (
                    <label className="inline-flex items-center space-x-2 text-xs font-medium text-emerald-700 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="Verified"
                        checked={formStatus === 'Verified'}
                        onChange={() => setFormStatus('Verified')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Mark Directly Verified</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-darkblue hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingEntry ? 'Update Entry' : 'Save Log Entry'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. LEADER REVIEW / VERIFY MODAL */}
      {/* ======================================================== */}
      {isReviewModalOpen && reviewingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-darkblue">Review Log Book Entry</h3>
                  <p className="text-[11px] text-gray-500">{reviewingEntry.memberName} - {reviewingEntry.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-2">
                  Decision
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('Verified')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      reviewStatus === 'Verified'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verify & Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('Needs Revision')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      reviewStatus === 'Needs Revision'
                        ? 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-500/20 shadow-2xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Request Revision</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-darkblue uppercase tracking-wider mb-1.5">
                  Supervisor Remarks & Signature
                </label>
                <textarea
                  rows={3}
                  placeholder="Add feedback, badge sign-off notes, or instructions for revision..."
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-darkblue/20 focus:border-darkblue transition-all"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2 rounded-xl bg-darkblue text-white text-xs font-bold hover:bg-blue-900 transition-all shadow-xs disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
