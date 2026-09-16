import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_ROVER_POLICY, PolicyItem, sortPolicyItems } from '../data/policyData';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle, 
  Sparkles,
  BookOpen,
  Info,
  ChevronRight,
  ListOrdered,
  Lock,
  CornerDownRight
} from 'lucide-react';

interface PolicyPageProps {
  onNavigate: (path: string) => void;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isSecretary = user?.role === 'Secretary';

  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // CRUD Modal states for Secretary
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  // Form state
  const [formNumber, setFormNumber] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete modal state
  const [deleteTargetPolicy, setDeleteTargetPolicy] = useState<PolicyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch policies from backend
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/policies');
      if (res.ok) {
        const data = await res.json();
        if (data.policies && Array.isArray(data.policies)) {
          setPolicies(sortPolicyItems(data.policies));
        }
      }
    } catch (err) {
      console.error('Error fetching policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Filter policies by search query
  const filteredPolicies = sortPolicyItems(
    policies.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const safeNum = item.number || '';
      const safeTitle = item.title || '';
      const safeContent = item.content || '';
      return safeNum.toLowerCase().includes(q) ||
        safeTitle.toLowerCase().includes(q) ||
        safeContent.toLowerCase().includes(q);
    })
  );

  // Open Create Modal
  const handleOpenCreateModal = (parentNumber?: string) => {
    setModalMode('create');
    setEditingPolicyId(null);
    let defaultNum = '1';
    if (parentNumber) {
      defaultNum = `${parentNumber}.1`;
    } else if (policies.length > 0) {
      const topLevels = policies
        .map(p => parseInt((p.number || '').split('.')[0], 10))
        .filter(n => !isNaN(n));
      const nextNum = topLevels.length > 0 ? Math.max(...topLevels) + 1 : 1;
      defaultNum = String(nextNum);
    }
    setFormNumber(defaultNum);
    setFormTitle('');
    setFormContent('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: PolicyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalMode('edit');
    setEditingPolicyId(item.id);
    setFormNumber(item.number);
    setFormTitle(item.title);
    setFormContent(item.content);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (item: PolicyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTargetPolicy(item);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNum = formNumber.trim();
    const cleanTitle = formTitle.trim();
    const cleanContent = formContent.trim();

    if (!cleanNum) {
      setErrorMsg('Policy section number (e.g. 1.1.1) is required.');
      return;
    }

    if (!cleanTitle) {
      setErrorMsg('Policy title is required.');
      return;
    }

    if (!cleanContent) {
      setErrorMsg('Policy clause content is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/policies', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': user?.role || ''
          },
          body: JSON.stringify({
            number: cleanNum,
            title: cleanTitle,
            content: cleanContent,
            userRole: user?.role
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create policy section');

        setPolicies(sortPolicyItems(data.policies));
        setIsModalOpen(false);
        showToast('success', `Policy clause ${cleanNum} added successfully.`);
      } else {
        const res = await fetch(`/api/policies/${editingPolicyId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': user?.role || ''
          },
          body: JSON.stringify({
            number: cleanNum,
            title: cleanTitle,
            content: cleanContent,
            userRole: user?.role
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update policy section');

        setPolicies(sortPolicyItems(data.policies));
        setIsModalOpen(false);
        showToast('success', `Policy clause ${cleanNum} updated successfully.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving policy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTargetPolicy) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/policies/${deleteTargetPolicy.id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({ userRole: user?.role })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete policy clause');

      setPolicies(sortPolicyItems(data.policies));
      setDeleteTargetPolicy(null);
      showToast('success', `Policy clause ${deleteTargetPolicy.number} removed.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete policy clause.');
    } finally {
      setIsDeleting(false);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackToast({ type, text });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  // Render depth badge and layout styling per decimal level
  const getDepthStyle = (numberStr?: string) => {
    const safeNumStr = numberStr || '';
    const dotsCount = (safeNumStr.match(/\./g) || []).length;
    const depth = dotsCount + 1;

    switch (depth) {
      case 1:
        return {
          containerClass: 'bg-white border-2 border-darkblue/20 shadow-sm p-5 sm:p-6 rounded-2xl mb-4',
          badgeClass: 'bg-darkblue text-white text-sm font-mono font-bold px-3 py-1 rounded-lg',
          titleClass: 'text-lg sm:text-xl font-black text-darkblue',
          indentClass: 'ml-0'
        };
      case 2:
        return {
          containerClass: 'bg-sky-50/50 border border-sky-200 p-4 sm:p-5 rounded-xl mb-3 ml-2 sm:ml-5',
          badgeClass: 'bg-maroon text-white text-xs font-mono font-bold px-2.5 py-0.5 rounded-md',
          titleClass: 'text-base font-bold text-gray-900',
          indentClass: 'ml-2 sm:ml-5'
        };
      case 3:
        return {
          containerClass: 'bg-amber-50/40 border border-amber-200 p-4 rounded-xl mb-2.5 ml-4 sm:ml-10',
          badgeClass: 'bg-amber-800 text-white text-xs font-mono font-bold px-2 py-0.5 rounded-md',
          titleClass: 'text-sm font-bold text-amber-950',
          indentClass: 'ml-4 sm:ml-10'
        };
      case 4:
        return {
          containerClass: 'bg-emerald-50/40 border border-emerald-200 p-3.5 rounded-xl mb-2 ml-6 sm:ml-14',
          badgeClass: 'bg-emerald-800 text-white text-xs font-mono font-bold px-2 py-0.5 rounded-md',
          titleClass: 'text-xs font-bold text-emerald-950',
          indentClass: 'ml-6 sm:ml-14'
        };
      default:
        // Depth 5 and beyond (e.g., 1.1.1.1.1, 1.2.1.1.1)
        return {
          containerClass: 'bg-purple-50/40 border border-purple-200 p-3 rounded-xl mb-2 ml-8 sm:ml-18',
          badgeClass: 'bg-purple-800 text-white text-xs font-mono font-bold px-2 py-0.5 rounded-md',
          titleClass: 'text-xs font-bold text-purple-950',
          indentClass: 'ml-8 sm:ml-18'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in duration-200">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold ${
            feedbackToast.type === 'success' 
              ? 'bg-emerald-900 text-white border-emerald-700' 
              : 'bg-red-900 text-white border-red-700'
          }`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{feedbackToast.text}</span>
            <button onClick={() => setFeedbackToast(null)} className="text-white/70 hover:text-white ml-2 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-maroon/10 text-maroon rounded-full font-bold text-xs uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>Hierarchical Operating Policy</span>
              </div>
              {isSecretary ? (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-full font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Secretary Administrative CRUD Access</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full font-medium text-xs">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Member Read-Only Access</span>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-darkblue tracking-tight">
              Rover Operating Policy
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 max-w-3xl leading-relaxed">
              Official operating protocols structured in ordered decimal hierarchy (e.g. <code>1</code>, <code>1.1</code>, <code>1.1.1</code>, <code>1.1.1.1</code>, <code>1.1.1.1.1</code>, <code>1.2.1.1.1</code>, <code>2</code>, <code>2.1.1</code>).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search policy numbers or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon bg-gray-50/70"
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

            {/* Secretary Add Policy Button */}
            {isSecretary && (
              <button
                onClick={() => handleOpenCreateModal()}
                className="px-4 py-2.5 bg-maroon text-white font-bold text-xs rounded-xl hover:bg-[#660000] transition-all shadow-xs flex items-center justify-center space-x-2 shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Policy Section</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hierarchical Policy List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-400 text-xs font-semibold">
            Loading Rover Operating Policy...
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-500 text-xs space-y-2 border border-gray-200">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="font-bold">No matching policy clauses found.</p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-maroon font-bold underline">
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          filteredPolicies.map((item) => {
            const safeNum = item.number || '';
            const style = getDepthStyle(safeNum);
            const dotsCount = (safeNum.match(/\./g) || []).length;

            return (
              <div key={item.id} className={style.containerClass}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0">
                    <span className={style.badgeClass}>
                      {safeNum}
                    </span>
                    <div>
                      <h3 className={style.titleClass}>
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mt-1.5 whitespace-pre-line">
                        {item.content}
                      </p>
                    </div>
                  </div>

                  {/* Secretary Actions */}
                  {isSecretary && (
                    <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-start pt-2 sm:pt-0">
                      <button
                        onClick={() => handleOpenCreateModal(safeNum)}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center space-x-1"
                        title={`Add sub-clause under ${safeNum}`}
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>Sub-clause</span>
                      </button>
                      <button
                        onClick={(e) => handleOpenEditModal(item, e)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center space-x-1"
                        title="Edit policy"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => handleOpenDeleteModal(item, e)}
                        className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold flex items-center space-x-1"
                        title="Delete policy"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT MODAL FOR SECRETARY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 relative overflow-hidden">
            
            <div className="p-6 bg-gradient-to-r from-darkblue to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-maroon text-white rounded-xl">
                  {modalMode === 'create' ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {modalMode === 'create' ? 'Add Decimal Policy Clause' : 'Edit Policy Clause'}
                  </h2>
                  <p className="text-xs text-sky-200">
                    Crew Secretary Policy Authoring Panel
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Section Decimal Number (e.g. 1, 1.1, 1.1.1, 1.1.1.1, 1.1.1.1.1, 1.2.1.1.1, 2.1.1) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1.1 text or 1.2.1.1.1"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Clause Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Digital & Physical Conduct Guidelines"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Clause Wording & Details *
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed policy text..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-maroon hover:bg-[#660000] text-white font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Saving Policy...' : modalMode === 'create' ? 'Save Policy Clause' : 'Update Policy Clause'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTargetPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-darkblue">Delete Policy Clause</h3>
                <p className="text-xs text-gray-500 font-mono">Section {deleteTargetPolicy.number || ''}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete policy <strong>{deleteTargetPolicy.number || ''} - {deleteTargetPolicy.title || ''}</strong>? This action will remove it from the official Rover Operating Policy.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteTargetPolicy(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
              >
                {isDeleting ? 'Deleting...' : 'Delete Policy'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
