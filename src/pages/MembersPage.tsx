import React, { useState, useEffect } from 'react';
import { formatDateDDMMMYYYY } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { MemberApplication } from '../types';
import { calculateTimeRemainingForAward, getProgressionRequirement } from '../utils/awardTimeline';
import { 
  Users, 
  Search, 
  Award, 
  MapPin, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  X, 
  Grid, 
  List, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Plus,
  UserPlus,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Edit2,
  CheckCircle2,
  Trash2,
  Mail
} from 'lucide-react';
import { BulkMemberModal } from '../components/BulkMemberModal';
import { AddMemberModal } from '../components/AddMemberModal';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { MemberDetailsModal } from '../components/MemberDetailsModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

interface MembersPageProps {
  onNavigate: (path: string) => void;
}

export const MembersPage: React.FC<MembersPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isSecretary = user?.role === 'Secretary';
  const [members, setMembers] = useState<MemberApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberApplication | null>(null);

  // Delete Confirmation States
  const [memberPendingDelete, setMemberPendingDelete] = useState<MemberApplication | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  // Multi-selection for bulk operations
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Rover' | 'Explorer'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [termFilter, setTermFilter] = useState<string>('All');
  const [awardFilter, setAwardFilter] = useState<string>('All');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const fetchMembers = () => {
    setLoading(true);
    setError(null);
    fetch('/api/members')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load members directory.');
        return res.json();
      })
      .then((data) => {
        setMembers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error fetching members.');
        setLoading(false);
      });
  };

  const handleRequestDeleteMember = (memberToDelete: MemberApplication) => {
    setMemberPendingDelete(memberToDelete);
  };

  const confirmDeleteSingleMember = async () => {
    if (!memberPendingDelete) return;
    setIsDeletingMember(true);
    try {
      const res = await fetch(`/api/members/${memberPendingDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete member from database.');
      
      const deletedName = memberPendingDelete.fullName;
      setSelectedMember(null);
      setMemberPendingDelete(null);
      setSelectedMemberIds((prev) => prev.filter((id) => id !== memberPendingDelete.id));
      setActionNotice({
        type: 'success',
        text: `Member record for "${deletedName}" has been successfully deleted.`
      });
      fetchMembers();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err.message || 'Error deleting member.'
      });
    } finally {
      setIsDeletingMember(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedMemberIds.length === 0) return;
    setIsBulkDeleteConfirmOpen(true);
  };

  const confirmBulkDeleteMembers = async () => {
    if (selectedMemberIds.length === 0) return;
    setIsDeletingMember(true);
    try {
      const count = selectedMemberIds.length;
      const res = await fetch('/api/admin/members/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: selectedMemberIds })
      });
      if (!res.ok) throw new Error('Failed to bulk delete members.');
      
      setSelectedMemberIds([]);
      setIsBulkDeleteConfirmOpen(false);
      setActionNotice({
        type: 'success',
        text: `Successfully deleted ${count} member record(s) from the database.`
      });
      fetchMembers();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err.message || 'Error deleting selected members.'
      });
    } finally {
      setIsDeletingMember(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Available unique terms from data
  const availableTerms = Array.from(
    new Set(members.map((m) => m.term).filter((t): t is string => Boolean(t && t.trim())))
  );

  // Filter out non-scout administrative accounts and show only directory members
  const directoryMembers = members.filter((m) => 
    m.role !== 'Leader' && 
    m.role !== 'Secretary' && 
    m.role !== 'Admin'
  );

  // Filter logic
  const filteredMembers = directoryMembers.filter((m) => {
    if (!m) return false;
    if (roleFilter !== 'All' && m.role !== roleFilter) return false;
    
    if (statusFilter !== 'All') {
      const ms = (m.status || '').toLowerCase();
      if (statusFilter === 'Approved') {
        const isApprovedStatus = ms.includes('approved') || ms.includes('active') || ms.includes('investiture') || ms.includes('verified');
        if (!isApprovedStatus) return false;
      } else if (statusFilter === 'Pending Review') {
        const isPendingStatus = ms.includes('pending') || ms.includes('review') || !ms;
        if (!isPendingStatus) return false;
      } else if (statusFilter === 'Interview & Investiture') {
        const isInvestitureStatus = ms.includes('interview') || ms.includes('investiture');
        if (!isInvestitureStatus) return false;
      } else if (statusFilter === 'Suspended') {
        if (!ms.includes('suspended')) return false;
      } else if (statusFilter === 'Voluntary Suspension') {
        if (!ms.includes('voluntary')) return false;
      } else if (statusFilter === 'Resigned') {
        if (!ms.includes('resigned') && !ms.includes('resignation')) return false;
      } else {
        if (m.status !== statusFilter) return false;
      }
    }

    if (termFilter !== 'All' && m.term !== termFilter) return false;
    if (awardFilter !== 'All' && m.awardGoal !== awardFilter) return false;
    if (levelFilter !== 'All' && m.currentLevel !== levelFilter) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = m.fullName?.toLowerCase().includes(q) || m.commonName?.toLowerCase().includes(q);
      const idMatch = m.idCardNumber?.toLowerCase().includes(q);
      const emailMatch = m.email?.toLowerCase().includes(q);
      const phoneMatch = m.phoneNumber?.toLowerCase().includes(q) || m.mobileNumber?.toLowerCase().includes(q);
      const whatsappMatch = m.whatsappNumber?.toLowerCase().includes(q);
      const termMatch = m.term?.toLowerCase().includes(q);
      const statusMatch = m.status?.toLowerCase().includes(q);
      const cityMatch = m.currentAddress?.city?.toLowerCase().includes(q) || m.permanentAddress?.city?.toLowerCase().includes(q);

      return nameMatch || idMatch || emailMatch || phoneMatch || whatsappMatch || termMatch || statusMatch || cityMatch;
    }

    return true;
  });

  // Metrics (exclusively for Rovers and Explorers, excluding Secretary/Admin accounts)
  const isInvestedActive = (m: MemberApplication) => {
    if (!m) return false;
    const ms = (m.status || '').toLowerCase();
    return ms.includes('active') || ms.includes('approved') || ms.includes('investiture') || ms.includes('verified') || !m.status;
  };
  const activeExplorersCount = directoryMembers.filter((m) => m && m.role === 'Explorer' && isInvestedActive(m)).length;
  const activeRoversCount = directoryMembers.filter((m) => m && m.role === 'Rover' && isInvestedActive(m)).length;
  const suspendedExplorersCount = directoryMembers.filter((m) => m && m.role === 'Explorer' && (m.status || '').toLowerCase().includes('suspended')).length;
  const suspendedRoversCount = directoryMembers.filter((m) => m && m.role === 'Rover' && (m.status || '').toLowerCase().includes('suspended')).length;
  const pendingInvestitureCount = directoryMembers.filter((m) => m && !isInvestedActive(m) && !(m.status || '').toLowerCase().includes('suspended') && !(m.status || '').toLowerCase().includes('resigned')).length;
  const totalActiveCount = activeExplorersCount + activeRoversCount;

  const toggleSelectMember = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMemberIds.length === filteredMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredMembers.map((m) => m.id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 ${
          actionNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center space-x-2 text-xs font-bold">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-gray-500 hover:text-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-darkblue text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-sky-200 border border-white/15">
              <Users className="w-3.5 h-3.5 text-sky-300" />
              <span>Arabiyya Member Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Rover & Explorer Roster
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
              Explore profiles, progression milestones, terms, and investiture records for all Arabiyya Rovers and Explorers.
            </p>
            <p className="text-[11px] text-amber-200 font-medium italic flex items-center space-x-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Leaders and Administrative Council are managed under leadership.</span>
            </p>
          </div>

          {/* Key Stats Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center shrink-0">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3 text-white">
              <div className="text-2xl font-black text-amber-300 leading-none">{activeExplorersCount}</div>
              <div className="text-[10px] font-bold text-sky-200 uppercase tracking-wider mt-1">Active Explorers</div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3 text-white">
              <div className="text-2xl font-black text-sky-300 leading-none">{activeRoversCount}</div>
              <div className="text-[10px] font-bold text-sky-200 uppercase tracking-wider mt-1">Active Rovers</div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3 text-white">
              <div className="text-2xl font-black text-red-300 leading-none">{suspendedExplorersCount}</div>
              <div className="text-[10px] font-bold text-sky-200 uppercase tracking-wider mt-1">Suspended Explorers</div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3 text-white">
              <div className="text-2xl font-black text-rose-300 leading-none">{suspendedRoversCount}</div>
              <div className="text-[10px] font-bold text-sky-200 uppercase tracking-wider mt-1">Suspended Rovers</div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3 text-white">
              <div className="text-2xl font-black text-amber-200 leading-none">{pendingInvestitureCount}</div>
              <div className="text-[10px] font-bold text-sky-200 uppercase tracking-wider mt-1">Pending Investiture</div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3 text-white">
              <div className="text-2xl font-black text-emerald-300 leading-none">{totalActiveCount}</div>
              <div className="text-[10px] font-bold text-sky-200 uppercase tracking-wider mt-1">Total Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar when members selected */}
      {selectedMemberIds.length > 0 && (
        <div className="bg-maroon text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in sticky top-4 z-20 border border-white/20">
          <div className="flex items-center space-x-3 text-xs font-bold">
            <span className="bg-white/20 px-3 py-1 rounded-xl">
              {selectedMemberIds.length} Member{selectedMemberIds.length > 1 ? 's' : ''} Selected
            </span>
            <span className="text-amber-200 hidden sm:inline">
              Ready for bulk deletion
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedMemberIds([])}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Controls: Search, Filters, and Layout Toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search member by full name, ID card, mobile, WhatsApp, term, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon focus:border-maroon bg-gray-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isSecretary && (
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="px-3 py-2 bg-maroon text-white hover:bg-[#660000] rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
                {showAddMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-30">
                    <button
                      onClick={() => {
                        setShowAddMenu(false);
                        setShowSingleModal(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-darkblue hover:bg-sky-50 flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4 text-sky-600" />
                      <div>
                        <div>Create Member Separately</div>
                        <div className="text-[10px] text-gray-400 font-normal">Input all 22 tracked fields</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowAddMenu(false);
                        setShowInviteModal(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-darkblue hover:bg-sky-50 flex items-center space-x-2"
                    >
                      <Mail className="w-4 h-4 text-maroon" />
                      <div>
                        <div>Invite by Email</div>
                        <div className="text-[10px] text-gray-400 font-normal">Send registration link</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowAddMenu(false);
                        setShowBulkModal(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-darkblue hover:bg-sky-50 flex items-center space-x-2"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div>Bulk Create & Sync (CSV/TSV)</div>
                        <div className="text-[10px] text-gray-400 font-normal">Download template with all 22 fields</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={fetchMembers}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-darkblue flex items-center space-x-1.5 transition-colors shadow-2xs"
              title="Refresh Roster"
            >
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Sync Roster</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-darkblue shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Grid Cards View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-darkblue shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Compact Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 border-t border-gray-100 text-xs">
          {/* Section Filter */}
          <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
            <span className="font-bold text-gray-500 uppercase text-[10px]">Section:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="font-bold text-darkblue bg-transparent focus:outline-hidden"
            >
              <option value="All">All Sections</option>
              <option value="Rover">Rovers Only</option>
              <option value="Explorer">Explorers Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
            <span className="font-bold text-gray-500 uppercase text-[10px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="font-bold text-darkblue bg-transparent focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved / Invested</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Interview & Investiture">Interview & Investiture</option>
              <option value="Suspended">Suspended</option>
              <option value="Voluntary Suspension">Voluntary Suspension</option>
              <option value="Resigned">Resigned</option>
            </select>
          </div>

          {/* Term Filter */}
          {availableTerms.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
              <span className="font-bold text-gray-500 uppercase text-[10px]">Term:</span>
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="font-bold text-darkblue bg-transparent focus:outline-hidden"
              >
                <option value="All">All Terms</option>
                {availableTerms.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Award Goal Filter */}
          <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
            <span className="font-bold text-gray-500 uppercase text-[10px]">Award:</span>
            <select
              value={awardFilter}
              onChange={(e) => setAwardFilter(e.target.value)}
              className="font-bold text-darkblue bg-transparent focus:outline-hidden"
            >
              <option value="All">All Awards</option>
              <option value="Baden-Powell Award">Baden-Powell Award</option>
              <option value="President Scout Award">President Scout Award</option>
              <option value="None">No Award Intent</option>
            </select>
          </div>

          {/* Select All Checkbox for Admin */}
          {isSecretary && filteredMembers.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 font-bold text-darkblue transition-colors ml-auto"
            >
              {selectedMemberIds.length === filteredMembers.length ? (
                <CheckSquare className="w-4 h-4 text-maroon" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span>
                {selectedMemberIds.length === filteredMembers.length ? 'Deselect All' : 'Select All'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-maroon border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-600">Loading Member Directory...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800 space-y-2">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <div className="font-bold text-base">{error}</div>
          <p className="text-xs text-red-600">Please refresh or verify server connection.</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-darkblue">No Members Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              No registered members matched your search criteria or selected filters. Try clearing your filters or search query.
            </p>
          </div>
          <button
            onClick={() => {
              setRoleFilter('All');
              setStatusFilter('All');
              setTermFilter('All');
              setAwardFilter('All');
              setLevelFilter('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-maroon text-white font-bold text-xs rounded-xl hover:bg-[#660000] transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => {
            const isSelected = selectedMemberIds.includes(member.id);
            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={`bg-white rounded-2xl border ${
                  isSelected ? 'border-maroon ring-2 ring-maroon/20' : 'border-gray-200 hover:border-sky-300'
                } p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between relative`}
              >
                <div className="space-y-4">
                  {/* Top Badge Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {isSecretary && (
                        <button
                          type="button"
                          onClick={(e) => toggleSelectMember(member.id, e)}
                          className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-maroon"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-maroon" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <div className="w-12 h-12 rounded-2xl bg-darkblue text-white font-black text-lg flex items-center justify-center shadow-xs border border-blue-900 shrink-0">
                        {member.commonName ? member.commonName.charAt(0) : member.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-darkblue group-hover:text-maroon transition-colors line-clamp-1">
                          {member.fullName}
                        </h3>
                        <div className="text-xs text-gray-500 font-medium">
                          "{member.commonName || member.fullName.split(' ')[0]}" • ID:{' '}
                          <span className="font-mono font-bold">{member.idCardNumber}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                        member.role === 'Rover'
                          ? 'bg-sky-100 text-sky-900 border border-sky-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>

                  {/* Info Fields */}
                  <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-500">Status:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          (!isSecretary && (member.status === 'Approved' || member.status === 'Investiture')) || member.status === 'Active' || member.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {(!isSecretary && (member.status === 'Approved' || member.status === 'Investiture')) ? 'Active' : (member.status || 'Active')}
                      </span>
                    </div>

                    {/* Investiture Date */}
                    {member.investitureDate && (
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-500">Investiture Date:</span>
                        <span className="font-mono font-bold text-emerald-800 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>{formatDateDDMMMYYYY(member.investitureDate)}</span>
                        </span>
                      </div>
                    )}

                    {/* Attendance */}
                    {(member.overallAttendanceWithoutExcused || member.overallAttendanceWithExcused) && (
                      <div className="flex items-center justify-between text-[11px] bg-gray-50 px-2 py-1 rounded-lg">
                        <span className="font-semibold text-gray-500">Attendance:</span>
                        <span className="font-bold text-darkblue">
                          {member.overallAttendanceWithoutExcused || '-'} (Excused: {member.overallAttendanceWithExcused || '-'})
                        </span>
                      </div>
                    )}

                    {/* Award Goal */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-500">Award Intent:</span>
                      <span className="font-bold text-darkblue flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{member.awardGoal || 'None'}</span>
                      </span>
                    </div>

                    {/* Phone / Mobile */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-500">Contact:</span>
                      <span className="font-mono font-medium text-gray-800">
                        {member.mobileNumber || member.phoneNumber || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Link Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:text-maroon transition-colors">
                  <span>View All 22 Logged Fields</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                <tr>
                  {isSecretary && <th className="px-4 py-3 w-10">Select</th>}
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3">ID Card</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Investiture Date</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Mobile / Phone</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  return (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`hover:bg-sky-50/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {isSecretary && (
                        <td className="px-4 py-3" onClick={(e) => toggleSelectMember(member.id, e)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-maroon" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="font-bold text-darkblue">{member.fullName}</div>
                        <div className="text-[11px] text-gray-500">
                          "{member.commonName || member.fullName.split(' ')[0]}"
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-gray-700">
                        {member.idCardNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            member.role === 'Rover'
                              ? 'bg-sky-100 text-sky-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">{member.term || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            member.status === 'Investiture'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-800 font-medium">
                        {member.investitureDate ? formatDateDDMMMYYYY(member.investitureDate) : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {member.overallAttendanceWithoutExcused || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {member.mobileNumber || member.phoneNumber || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMember(member);
                          }}
                          className="px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold rounded-lg transition-colors"
                        >
                          Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      <BulkMemberModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={fetchMembers}
      />

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      <AddMemberModal
        isOpen={showSingleModal}
        onClose={() => setShowSingleModal(false)}
        onSuccess={fetchMembers}
      />

      <MemberDetailsModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        isSecretary={isSecretary}
        onDeleteMember={handleRequestDeleteMember}
        onStatusUpdated={fetchMembers}
        calculateTimeRemainingForAward={calculateTimeRemainingForAward}
        getProgressionRequirement={getProgressionRequirement}
      />

      {/* Delete Confirmation Modal for Single Member */}
      <DeleteConfirmationModal
        isOpen={Boolean(memberPendingDelete)}
        onClose={() => {
          if (!isDeletingMember) setMemberPendingDelete(null);
        }}
        onConfirm={confirmDeleteSingleMember}
        title="Confirm Member Record Deletion"
        description="Are you sure you want to permanently delete this member record? This will completely remove their profile, term records, and progression logs from the database."
        itemName={memberPendingDelete ? `${memberPendingDelete.fullName} (${memberPendingDelete.idCardNumber})` : undefined}
        itemDetails={
          memberPendingDelete ? (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1.5 text-[11px] text-gray-700">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-500">Section / Role:</span>
                <span className="font-bold text-darkblue">{memberPendingDelete.role} Member</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-500">Status:</span>
                <span className="font-medium text-gray-800">{memberPendingDelete.status || 'Active'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-500">Contact Number:</span>
                <span className="font-mono text-gray-800">{memberPendingDelete.mobileNumber || memberPendingDelete.phoneNumber || 'N/A'}</span>
              </div>
            </div>
          ) : undefined
        }
        confirmText="Yes, Permanently Delete"
        cancelText="Cancel / Keep Record"
        isDeleting={isDeletingMember}
      />

      {/* Delete Confirmation Modal for Bulk Deletion */}
      <DeleteConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => {
          if (!isDeletingMember) setIsBulkDeleteConfirmOpen(false);
        }}
        onConfirm={confirmBulkDeleteMembers}
        title="Confirm Bulk Member Deletion"
        description={`Are you sure you want to permanently delete the ${selectedMemberIds.length} selected member records from the database? This action is irreversible.`}
        itemName={`${selectedMemberIds.length} Selected Member Records`}
        itemDetails={
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2 text-[11px]">
            <div className="font-semibold text-gray-600">Selected Members:</div>
            <div className="max-h-32 overflow-y-auto divide-y divide-gray-200 pr-1 space-y-1">
              {members
                .filter((m) => selectedMemberIds.includes(m.id))
                .map((m) => (
                  <div key={m.id} className="pt-1 flex items-center justify-between text-gray-800">
                    <span className="font-bold truncate max-w-[180px]">{m.fullName}</span>
                    <span className="font-mono text-[10px] text-gray-500">{m.idCardNumber}</span>
                  </div>
                ))}
            </div>
          </div>
        }
        confirmText={`Yes, Delete ${selectedMemberIds.length} Records`}
        cancelText="Cancel"
        isDeleting={isDeletingMember}
      />
    </div>
  );
};
