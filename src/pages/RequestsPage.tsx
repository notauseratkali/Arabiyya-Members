import React, { useState, useEffect } from 'react';
import { formatDateDDMMMYYYY } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { ApplicationPipelineStatus, LeaderApplication, MemberApplication, ProfileUpdateRequest } from '../types';
import { Inbox, ShieldAlert, CheckCircle2, Clock, Calendar, UserCheck, Check, X, FileText, AlertCircle } from 'lucide-react';
import { ProfileUpdateDetail } from '../components/ProfileUpdateDetail';

const renderRequestedChanges = (changes: any) => {
  if (!changes) return null;
  
  let parsedChanges = changes;
  if (typeof changes === 'string') {
    try {
      parsedChanges = JSON.parse(changes);
    } catch (e) {
      return <div className="text-gray-600 font-mono text-[11px] bg-white p-2 rounded-lg border border-gray-100 break-all">{changes}</div>;
    }
  }

  const items: { label: string; value: string }[] = [];
  
  const addField = (key: string, val: any) => {
    if (val === undefined || val === null || val === '') return;
    if (key === 'id' || key === 'memberId' || key === 'passwordHash' || key === 'username') return;

    if (typeof val === 'object') {
      if (key === 'currentAddress' || key === 'permanentAddress') {
        const addrLines = [
          val.addressLine,
          val.district && val.district !== 'N/A' ? val.district : '',
          val.city,
          val.state,
          val.country
        ].filter(Boolean);
        if (addrLines.length > 0) {
          items.push({
            label: key === 'currentAddress' ? 'Current Address' : 'Permanent Address',
            value: addrLines.join(', ')
          });
        }
      } else {
        items.push({
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          value: JSON.stringify(val)
        });
      }
    } else {
      let friendlyLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      if (key === 'dob') friendlyLabel = 'Date of Birth';
      if (key === 'idCardNumber') friendlyLabel = 'ID Card Number';
      
      let formattedVal = String(val);
      if (typeof val === 'boolean') {
        formattedVal = val ? 'Yes' : 'No';
      }
      
      items.push({ label: friendlyLabel, value: formattedVal });
    }
  };

  Object.entries(parsedChanges).forEach(([key, val]) => {
    addField(key, val);
  });

  if (items.length === 0) {
    return <div className="text-gray-400 italic text-[11px] mt-1">No custom changes specified</div>;
  }

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-white border border-gray-200/80 rounded-xl p-3 max-w-full overflow-hidden">
      {items.map((item, idx) => (
        <div key={idx} className="text-[11px] leading-tight break-words">
          <span className="font-bold text-gray-400 uppercase text-[9px] block tracking-wide mb-0.5">{item.label}</span>
          <span className="font-semibold text-darkblue">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

interface RequestsPageProps {
  onNavigate: (path: string) => void;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isSecretary = user?.role === 'Secretary';

  const [activeTab, setActiveTab] = useState<'join' | 'profile' | 'absence' | 'archived'>('join');
  const [loading, setLoading] = useState(true);

  const [leaderApps, setLeaderApps] = useState<LeaderApplication[]>([]);
  const [memberApps, setMemberApps] = useState<MemberApplication[]>([]);
  const [profileRequests, setProfileRequests] = useState<ProfileUpdateRequest[]>([]);
  const [absenceExcuses, setAbsenceExcuses] = useState<any[]>([]);

  // Investiture Date Modal state
  const [selectedMemberForInvestiture, setSelectedMemberForInvestiture] = useState<MemberApplication | null>(null);
  const [investitureDateInput, setInvestitureDateInput] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [newPipelineStatus, setNewPipelineStatus] = useState<ApplicationPipelineStatus>('Investiture');

  const loadRequests = () => {
    setLoading(true);
    fetch('/api/admin/requests')
      .then(res => res.json())
      .then(data => {
        setLeaderApps(data.leaderApplications || []);
        setMemberApps(data.memberApplications || []);
        setProfileRequests(data.profileUpdateRequests || []);
        setAbsenceExcuses(data.attendanceExcuses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (isSecretary) {
      loadRequests();
    }
  }, [user, isSecretary]);

  // Update Join Request Status & Log Investiture Date
  const handleUpdateJoinStatus = async () => {
    if (!selectedMemberForInvestiture) return;

    try {
      const res = await fetch(`/api/admin/requests/join/${selectedMemberForInvestiture.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newPipelineStatus,
          investitureDate: (newPipelineStatus === 'Approved' || newPipelineStatus === 'Investiture') ? investitureDateInput : undefined
        })
      });

      if (res.ok) {
        setSelectedMemberForInvestiture(null);
        loadRequests();
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // Handle Profile Update Action
  const handleProfileUpdateAction = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await fetch(`/api/admin/requests/profile-update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadRequests();
    } catch (err) {
      alert('Failed to process profile update request.');
    }
  };

  // Handle Absence Excuse Action
  const handleAbsenceAction = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await fetch('/api/attendance/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: status === 'Approved' ? 'Excused' : 'Unable To Attend',
          excuseStatus: status
        })
      });
      loadRequests();
    } catch (err) {
      alert('Failed to update excuse status.');
    }
  };

  if (!user || !isSecretary) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-darkblue mb-2">Access Restricted</h2>
          <p className="text-xs text-gray-600 mb-6">
            The Admin Requests page is strictly restricted to authorized Administrator accounts.
          </p>
          <button
            onClick={() => onNavigate('/signin')}
            className="px-6 py-2.5 bg-darkblue text-white text-xs font-bold rounded-xl"
          >
            Sign in as Administrator
          </button>
        </div>
      </div>
    );
  }

  const pendingMemberApps = (memberApps || []).filter(
    m => m && (m.status === 'Pending Review' || m.status === 'Interview & Investiture' || m.status === 'Processing' || m.status === 'Interview' || m.status === 'Investiture')
  );
  const reviewedMemberApps = (memberApps || []).filter(
    m => m && (m.status === 'Approved' || m.status === 'Rejected' || m.status === 'Active' || m.status === 'Resigned' || m.status === 'Suspended')
  );

  const pendingProfileRequests = (profileRequests || []).filter(p => p && p.status === 'Pending');
  const reviewedProfileRequests = (profileRequests || []).filter(p => p && (p.status === 'Approved' || p.status === 'Rejected'));

  const pendingAbsenceExcuses = (absenceExcuses || []).filter(a => a && a.excuseStatus === 'Pending Review');
  const reviewedAbsenceExcuses = (absenceExcuses || []).filter(a => a && (a.excuseStatus === 'Approved' || a.excuseStatus === 'Rejected'));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-maroon font-bold text-xs uppercase tracking-wider mb-1">
            <Inbox className="w-4 h-4" />
            <span>Administrative Panel</span>
          </div>
          <h1 className="text-2xl font-bold text-darkblue">Admin Requests Queue</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage leader candidates (30-day retention), join pipeline approvals with Investiture Dates, profile updates, and excuses.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/settings')}
          className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
        >
          Settings →
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-2 overflow-x-auto pb-1 scrollbar-none">
        
        <button
          onClick={() => setActiveTab('join')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'join'
              ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-2xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Join Requests Pipeline ({pendingMemberApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-2xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Profile Updates ({pendingProfileRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('absence')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'absence'
              ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-2xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Absence Excuses ({pendingAbsenceExcuses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'archived'
              ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-2xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Archived & Reviewed ({reviewedMemberApps.length + reviewedProfileRequests.length + reviewedAbsenceExcuses.length})</span>
        </button>

      </div>

      {/* TAB 1: JOIN REQUESTS PIPELINE */}
      {activeTab === 'join' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-600 font-medium">
            Review applicant details and update status. To grant full system login access, set status to <strong className="text-emerald-700">Investiture</strong> and input the official <strong>Investiture Date</strong>.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Applicant Name</th>
                  <th className="px-4 py-3">ID Card</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Award Goal</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3">Investiture Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {pendingMemberApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No pending join requests in queue. All requests have been reviewed and archived.
                    </td>
                  </tr>
                ) : (
                  pendingMemberApps.map((mem) => (
                    <tr key={mem.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-bold text-darkblue">
                        {mem.fullName}
                        <div className="text-[11px] text-gray-500 font-normal">{mem.email} • {mem.mobileNumber || mem.phoneNumber}</div>
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-gray-800">
                        {mem.idCardNumber}
                      </td>

                      <td className="px-4 py-3 font-bold text-maroon">
                        {mem.role}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {mem.awardGoal || 'Exploration'}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          (mem.status === 'Approved' || mem.status === 'Investiture') ? 'bg-emerald-100 text-emerald-800' :
                          (mem.status === 'Interview & Investiture' || mem.status === 'Interview') ? 'bg-amber-100 text-amber-800' :
                          (mem.status === 'Pending Review' || mem.status === 'Processing') ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {mem.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-emerald-800 font-bold">
                        {mem.investitureDate ? formatDateDDMMMYYYY(mem.investitureDate) : <span className="text-gray-400 italic">Not Logged</span>}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedMemberForInvestiture(mem);
                            setNewPipelineStatus(mem.status);
                            if (mem.investitureDate) setInvestitureDateInput(mem.investitureDate);
                          }}
                          className="px-3 py-1.5 bg-maroon text-white font-bold rounded-lg text-xs hover:bg-[#660000]"
                        >
                          Update Status & Investiture
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LEADER APPLICATIONS (30-day retention) */}
      {/* {activeTab === 'leader' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        ...
        </div>
      )} */}

      {/* TAB 3: PROFILE UPDATE REQUESTS */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-darkblue">Submitted Profile Update Requests</h3>

          {pendingProfileRequests.length === 0 ? (
            <div className="text-xs text-gray-500 py-6 text-center">No profile update requests pending.</div>
          ) : (
            <div className="space-y-3">
              {pendingProfileRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-darkblue text-sm">{req.memberName} ({req.idCardNumber})</div>
                    <div className="text-gray-600 mt-1">
                      <ProfileUpdateDetail request={req} currentMember={memberApps.find(m => m.id === req.memberId)} />
                    </div>
                  </div>

                  {req.status === 'Pending' ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleProfileUpdateAction(req.id, 'Approved')}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleProfileUpdateAction(req.id, 'Rejected')}
                        className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 flex items-center space-x-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this request?')) {
                            await fetch(`/api/admin/requests/profile-update/${req.id}`, { method: 'DELETE' });
                            loadRequests();
                          }
                        }}
                        className="px-3 py-1.5 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <span className="font-bold uppercase text-[11px] px-2.5 py-1 bg-gray-200 text-gray-800 rounded-full">
                      {req.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ABSENCE EXCUSES */}
      {activeTab === 'absence' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-darkblue">Submitted Absence Excuse Reasons</h3>

          {pendingAbsenceExcuses.length === 0 ? (
            <div className="text-xs text-gray-500 py-6 text-center">No absence excuses pending review.</div>
          ) : (
            <div className="space-y-3">
              {pendingAbsenceExcuses.map((att) => (
                <div key={att.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-darkblue text-sm">{att.memberName}</div>
                    <div className="text-gray-700 font-semibold mt-1">Reason: "{att.excuseReason}"</div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAbsenceAction(att.id, 'Approved')}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
                    >
                      Grant Excused
                    </button>
                    <button
                      onClick={() => handleAbsenceAction(att.id, 'Rejected')}
                      className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                    >
                      Reject Reason
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ARCHIVED & REVIEWED */}
      {activeTab === 'archived' && (
        <div className="space-y-6">
          {/* Section 1: Reviewed Join Requests */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h3 className="text-xs font-bold text-darkblue uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Reviewed Join Requests ({reviewedMemberApps.length})</span>
              </h3>
            </div>
            {reviewedMemberApps.length === 0 ? (
              <div className="p-6 text-xs text-gray-500 text-center">No reviewed join requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Applicant Name</th>
                      <th className="px-4 py-3">ID Card</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Investiture Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {reviewedMemberApps.map((mem) => (
                      <tr key={mem.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-bold text-darkblue">
                          {mem.fullName}
                          <div className="text-[11px] text-gray-500 font-normal">{mem.email} • {mem.mobileNumber || mem.phoneNumber}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-800">{mem.idCardNumber}</td>
                        <td className="px-4 py-3 font-bold text-maroon">{mem.role}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            mem.status === 'Approved' || mem.status === 'Active' || mem.status === 'Investiture' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {mem.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-emerald-800 font-bold">{mem.investitureDate ? formatDateDDMMMYYYY(mem.investitureDate) : <span className="text-gray-400 italic">N/A</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Reviewed Profile Updates */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
            <h3 className="text-xs font-bold text-darkblue uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-gray-100">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Reviewed Profile Updates ({reviewedProfileRequests.length})</span>
            </h3>
            {reviewedProfileRequests.length === 0 ? (
              <div className="text-xs text-gray-500 py-6 text-center">No reviewed profile updates found.</div>
            ) : (
              <div className="space-y-3">
                {reviewedProfileRequests.map((req) => (
                  <div key={req.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-darkblue text-sm">{req.memberName} ({req.idCardNumber})</div>
                      <div className="text-gray-500 font-bold uppercase text-[10px] mt-2">Requested Changes:</div>
                      {renderRequestedChanges(req.requestedChanges)}
                    </div>
                    <span className={`font-bold uppercase text-[10px] px-2.5 py-1 rounded-full self-start sm:self-center shrink-0 ${
                      req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Reviewed Absence Excuses */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
            <h3 className="text-xs font-bold text-darkblue uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-gray-100">
              <AlertCircle className="w-4 h-4 text-emerald-600" />
              <span>Reviewed Absence Excuses ({reviewedAbsenceExcuses.length})</span>
            </h3>
            {reviewedAbsenceExcuses.length === 0 ? (
              <div className="text-xs text-gray-500 py-6 text-center">No reviewed absence excuses found.</div>
            ) : (
              <div className="space-y-3">
                {reviewedAbsenceExcuses.map((att) => (
                  <div key={att.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-darkblue text-sm">{att.memberName}</div>
                      <div className="text-gray-700 font-semibold mt-1">Reason: "{att.excuseReason}"</div>
                    </div>
                    <span className={`font-bold uppercase text-[10px] px-2.5 py-1 rounded-full ${
                      att.excuseStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {att.excuseStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Investiture Modal */}
      {selectedMemberForInvestiture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-maroon max-w-md w-full p-6">
            <h3 className="text-base font-bold text-darkblue mb-2">Update Pipeline Status</h3>
            <p className="text-xs text-gray-600 mb-4">
              Applicant: <strong>{selectedMemberForInvestiture.fullName}</strong>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Status</label>
                <select
                  value={newPipelineStatus}
                  onChange={(e) => setNewPipelineStatus(e.target.value as ApplicationPipelineStatus)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-bold"
                >
                  <option value="Pending Review">Pending Review</option>
                  <option value="Interview & Investiture">Interview & Investiture</option>
                  <option value="Approved">Approved (Grant Access)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {(newPipelineStatus === 'Approved' || newPipelineStatus === 'Investiture') && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                    Official Investiture Date *
                  </label>
                  <input
                    type="date"
                    value={investitureDateInput}
                    onChange={(e) => setInvestitureDateInput(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg bg-white"
                  />
                  <p className="text-[11px] text-emerald-800 mt-1 font-medium">
                    Logging this Investiture Date unlocks system sign-in for the member.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedMemberForInvestiture(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateJoinStatus}
                className="px-5 py-2 bg-maroon text-white rounded-xl text-xs font-bold hover:bg-[#660000]"
              >
                Save & Update
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
