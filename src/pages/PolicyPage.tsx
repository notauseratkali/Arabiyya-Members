import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  PolicyItem, 
  PolicyImageSize, 
  PolicyImageAlignment, 
  sortPolicyItems 
} from '../data/policyData';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle, 
  BookOpen, 
  CornerDownRight,
  Image as ImageIcon,
  Upload,
  Link2,
  ZoomIn,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sliders,
  Camera,
  Check
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
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImageCaption, setFormImageCaption] = useState('');
  const [formImageSize, setFormImageSize] = useState<PolicyImageSize>('medium');
  const [formImageAlignment, setFormImageAlignment] = useState<PolicyImageAlignment>('center');
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete modal state
  const [deleteTargetPolicy, setDeleteTargetPolicy] = useState<PolicyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fullscreen image preview lightbox
  const [previewZoomImage, setPreviewZoomImage] = useState<{
    url: string;
    caption?: string;
    title?: string;
    number?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const safeCap = item.imageCaption || '';
      return safeNum.toLowerCase().includes(q) ||
        safeTitle.toLowerCase().includes(q) ||
        safeContent.toLowerCase().includes(q) ||
        safeCap.toLowerCase().includes(q);
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
    setFormImageUrl('');
    setFormImageCaption('');
    setFormImageSize('medium');
    setFormImageAlignment('center');
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
    setFormImageUrl(item.imageUrl || '');
    setFormImageCaption(item.imageCaption || '');
    setFormImageSize(item.imageSize || 'medium');
    setFormImageAlignment(item.imageAlignment || 'center');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (item: PolicyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTargetPolicy(item);
  };

  // Process image file upload (scales down & converts to base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 1400;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormImageUrl(dataUrl);
        } else {
          setFormImageUrl(loadEvent.target?.result as string);
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setErrorMsg('Could not read image. Please try another image file.');
        setIsProcessingImage(false);
      };
      img.src = loadEvent.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file.');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Quick inline size switcher for Secretary on the policy card
  const handleQuickChangeImageSize = async (item: PolicyItem, newSize: PolicyImageSize) => {
    try {
      const res = await fetch(`/api/policies/${item.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({
          imageSize: newSize,
          userRole: user?.role
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPolicies(sortPolicyItems(data.policies));
        showToast('success', `Policy ${item.number} picture size set to ${newSize}.`);
      }
    } catch (err: any) {
      showToast('error', 'Failed to update picture size.');
    }
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

    const payload = {
      number: cleanNum,
      title: cleanTitle,
      content: cleanContent,
      imageUrl: formImageUrl.trim(),
      imageCaption: formImageCaption.trim(),
      imageSize: formImageSize,
      imageAlignment: formImageAlignment,
      userRole: user?.role
    };

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/policies', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': user?.role || ''
          },
          body: JSON.stringify(payload)
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
          body: JSON.stringify(payload)
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

  // Helper classes for image sizing
  const getImageSizeClass = (size?: PolicyImageSize) => {
    switch (size) {
      case 'small':
        return 'max-w-[200px] sm:max-w-[220px]';
      case 'large':
        return 'max-w-full sm:max-w-[580px]';
      case 'full':
        return 'w-full max-w-full';
      case 'medium':
      default:
        return 'max-w-full sm:max-w-[380px]';
    }
  };

  // Helper classes for image alignment
  const getImageAlignmentClass = (alignment?: PolicyImageAlignment) => {
    switch (alignment) {
      case 'left':
        return 'self-start items-start text-left mr-auto';
      case 'right':
        return 'self-end items-end text-right ml-auto';
      case 'center':
      default:
        return 'self-center items-center text-center mx-auto';
    }
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
                <span>Official Policy Document</span>
              </div>
              <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full font-semibold text-[11px]">
                <span>Effective: 18 Dec 2023</span>
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-darkblue tracking-tight">
              Arabiyya Rover Crew Policy
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 max-w-3xl leading-relaxed">
              Official rules, regulations, uniform standards, committee duties, and governance protocols governing the Arabiyya Rover Crew.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search policy numbers, text, or captions..."
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
                <span>Add Policy Clause</span>
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

            return (
              <div key={item.id} className={style.containerClass}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <span className={style.badgeClass}>
                      {safeNum}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className={style.titleClass}>
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mt-1.5 whitespace-pre-line">
                        {item.content}
                      </p>

                      {/* CLAUSE PICTURE (IF PRESENT) */}
                      {item.imageUrl && (
                        <div className={`mt-3.5 flex flex-col ${getImageAlignmentClass(item.imageAlignment)}`}>
                          <div className={`relative group/img rounded-2xl overflow-hidden border border-gray-200/90 bg-gray-50 shadow-xs hover:shadow-md transition-all ${getImageSizeClass(item.imageSize)}`}>
                            <img
                              src={item.imageUrl}
                              alt={item.imageCaption || item.title || 'Policy diagram'}
                              className="w-full h-auto object-cover max-h-[500px] cursor-zoom-in group-hover/img:scale-[1.01] transition-transform duration-200"
                              onClick={() => setPreviewZoomImage({
                                url: item.imageUrl!,
                                caption: item.imageCaption,
                                title: item.title,
                                number: item.number
                              })}
                            />
                            {/* Zoom overlay badge */}
                            <button
                              onClick={() => setPreviewZoomImage({
                                url: item.imageUrl!,
                                caption: item.imageCaption,
                                title: item.title,
                                number: item.number
                              })}
                              className="absolute bottom-2.5 right-2.5 px-2 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100 transition-opacity backdrop-blur-xs flex items-center space-x-1 text-[11px] font-bold shadow-xs"
                              title="Click to zoom picture"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>Zoom</span>
                            </button>
                          </div>

                          {/* Image Caption */}
                          {item.imageCaption && (
                            <p className="text-[11px] text-gray-500 font-medium italic mt-1.5 flex items-center space-x-1">
                              <ImageIcon className="w-3 h-3 text-gray-400 shrink-0" />
                              <span>{item.imageCaption}</span>
                            </p>
                          )}

                          {/* Quick Secretary Size Switcher */}
                          {isSecretary && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-100/80 px-2.5 py-1 rounded-xl w-fit border border-gray-200/70">
                              <span className="text-gray-400 flex items-center space-x-1">
                                <Sliders className="w-3 h-3 text-gray-400" />
                                <span>Size:</span>
                              </span>
                              {(['small', 'medium', 'large', 'full'] as PolicyImageSize[]).map((sz) => (
                                <button
                                  key={sz}
                                  onClick={() => handleQuickChangeImageSize(item, sz)}
                                  className={`px-2 py-0.5 rounded-lg uppercase font-mono transition-all text-[10px] ${
                                    (item.imageSize || 'medium') === sz
                                      ? 'bg-maroon text-white font-bold shadow-2xs'
                                      : 'bg-white hover:bg-gray-200 text-gray-700 border border-gray-200'
                                  }`}
                                  title={`Set picture size to ${sz}`}
                                >
                                  {sz === 'small' ? 'S' : sz === 'medium' ? 'M' : sz === 'large' ? 'L' : 'Full'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

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
                        title="Edit policy & picture"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 relative overflow-hidden my-6">
            
            <div className="p-6 bg-gradient-to-r from-darkblue to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-maroon text-white rounded-xl">
                  {modalMode === 'create' ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {modalMode === 'create' ? 'Add Policy Clause' : 'Edit Policy Clause'}
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

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Section Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4.1 or 4.10.1"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Clause Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Official Cap & Insignia Specifications"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon bg-white"
                  />
                </div>
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
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon bg-white leading-relaxed"
                />
              </div>

              {/* PICTURE & DIAGRAM SECTION */}
              <div className="pt-2 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-maroon" />
                    <span className="text-xs font-bold text-darkblue uppercase tracking-wide">
                      Clause Picture / Diagram (Optional)
                    </span>
                  </div>

                  {/* Upload Method Tabs */}
                  <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1 ${
                        imageTab === 'upload' ? 'bg-white text-darkblue shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1 ${
                        imageTab === 'url' ? 'bg-white text-darkblue shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      <span>Web URL</span>
                    </button>
                  </div>
                </div>

                {imageTab === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 hover:border-maroon/50 rounded-2xl p-4 text-center cursor-pointer bg-gray-50/50 hover:bg-maroon/5 transition-all group"
                    >
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-maroon/10 text-gray-500 group-hover:text-maroon flex items-center justify-center transition-colors">
                          <Camera className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-gray-700">
                          {isProcessingImage ? 'Processing image...' : 'Click to browse or drop an image'}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          PNG, JPG, WEBP, or GIF (max 10MB)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="Paste image web URL (https://...)"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon bg-white"
                    />
                  </div>
                )}

                {/* PICTURE CONFIGURATION & PREVIEW (IF IMAGE SELECTED) */}
                {formImageUrl && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3.5 animate-in fade-in">
                    
                    {/* Size and Alignment Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                          Picture Display Size
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['small', 'medium', 'large', 'full'] as PolicyImageSize[]).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setFormImageSize(sz)}
                              className={`py-1.5 px-2 text-[10px] font-bold rounded-xl border text-center transition-all ${
                                formImageSize === sz 
                                  ? 'bg-maroon text-white border-maroon shadow-xs' 
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <div className="capitalize">{sz}</div>
                              <div className="text-[9px] opacity-80">
                                {sz === 'small' ? '220px' : sz === 'medium' ? '380px' : sz === 'large' ? '580px' : '100%'}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                          Alignment
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['left', 'center', 'right'] as PolicyImageAlignment[]).map((al) => (
                            <button
                              key={al}
                              type="button"
                              onClick={() => setFormImageAlignment(al)}
                              className={`py-2 px-2 text-[11px] font-bold rounded-xl border text-center flex items-center justify-center space-x-1.5 transition-all ${
                                formImageAlignment === al 
                                  ? 'bg-darkblue text-white border-darkblue shadow-xs' 
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {al === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                              {al === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                              {al === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                              <span className="capitalize">{al}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Caption Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                        Picture Caption (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Official placement of Rover epaulettes and badges"
                        value={formImageCaption}
                        onChange={(e) => setFormImageCaption(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon bg-white"
                      />
                    </div>

                    {/* Visual Live Preview in Form */}
                    <div className="pt-2 border-t border-gray-200/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-600">
                          Live Picture Preview ({formImageSize.toUpperCase()} / {formImageAlignment.toUpperCase()}):
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormImageUrl('');
                            setFormImageCaption('');
                          }}
                          className="text-red-600 hover:text-red-700 text-[11px] font-bold flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove Picture</span>
                        </button>
                      </div>

                      <div className={`flex flex-col ${getImageAlignmentClass(formImageAlignment)} bg-white p-3 rounded-2xl border border-gray-200`}>
                        <div className={`rounded-xl overflow-hidden border border-gray-200 bg-gray-50 ${getImageSizeClass(formImageSize)}`}>
                          <img
                            src={formImageUrl}
                            alt="Preview"
                            className="w-full h-auto object-cover max-h-60"
                          />
                        </div>
                        {formImageCaption && (
                          <p className="text-[11px] text-gray-500 italic mt-1.5 font-medium">
                            {formImageCaption}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isProcessingImage}
                  className="px-5 py-2.5 bg-maroon hover:bg-[#660000] text-white font-bold rounded-xl shadow-xs text-xs flex items-center space-x-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving Policy...' : modalMode === 'create' ? 'Save Policy Clause' : 'Update Policy Clause'}</span>
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

      {/* LIGHTBOX / FULLSCREEN ZOOM MODAL */}
      {previewZoomImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div 
            className="max-w-4xl w-full bg-gray-900 border border-gray-700/80 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="p-4 sm:p-5 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                {previewZoomImage.number && (
                  <span className="px-2.5 py-1 bg-maroon text-white text-xs font-mono font-bold rounded-lg">
                    Section {previewZoomImage.number}
                  </span>
                )}
                <h4 className="text-sm font-bold text-white truncate max-w-md">
                  {previewZoomImage.title || 'Policy Illustration'}
                </h4>
              </div>

              <button
                onClick={() => setPreviewZoomImage(null)}
                className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                title="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Image Stage */}
            <div className="p-4 sm:p-8 flex items-center justify-center max-h-[70vh] overflow-auto bg-black/40">
              <img
                src={previewZoomImage.url}
                alt={previewZoomImage.caption || 'Policy Diagram'}
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* Lightbox Caption Footer */}
            {previewZoomImage.caption && (
              <div className="p-4 bg-gray-900/90 border-t border-gray-800 text-center text-xs text-gray-300 font-medium">
                {previewZoomImage.caption}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
