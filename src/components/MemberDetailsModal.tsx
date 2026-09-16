import React, { useState, useEffect } from 'react';
import { formatDateDDMMMYYYY } from '../utils/dateUtils';
import { 
  X, 
  Award, 
  Calendar, 
  MapPin, 
  Phone, 
  Heart, 
  BarChart2, 
  Clock, 
  User,
  ShieldCheck,
  Lock,
  Edit3,
  Save,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Member } from '../types';
import { calculateTermFromInvestiture } from '../utils/termCalculation';

interface MemberDetailsModalProps {
  member: Member;
  onClose: () => void;
  isSecretary?: boolean;
  calculateTimeRemainingForAward?: (
    dob?: string,
    role?: string,
    ageYears?: number,
    ageMonths?: number,
    ageDays?: number,
    awardGoal?: string
  ) => string;
  onStatusUpdate?: (memberId: string, newStatus: string, resignationDate?: string) => Promise<void>;
  onStatusUpdated?: () => void;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  member,
  onClose,
  isSecretary = false,
  calculateTimeRemainingForAward,
  onStatusUpdate,
  onStatusUpdated,
}) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [resignationDateInput, setResignationDateInput] = useState(new Date().toISOString().split('T')[0]);

  // Member editing states (Secretary Only)
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states pre-populated with member data
  const [fullName, setFullName] = useState('');
  const [commonName, setCommonName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [role, setRole] = useState('Rover');
  const [awardGoal, setAwardGoal] = useState('None');
  const [currentLevel, setCurrentLevel] = useState('Square');
  const [isNewToScouting, setIsNewToScouting] = useState('No');
  const [lastScoutGroup, setLastScoutGroup] = useState('');
  const [permAddress, setPermAddress] = useState('');
  const [currAddress, setCurrAddress] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [telegramNumber, setTelegramNumber] = useState('');
  const [telegramTag, setTelegramTag] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instagramTag, setInstagramTag] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Parent');
  const [emergencyNumber, setEmergencyNumber] = useState('');
  const [investitureDate, setInvestitureDate] = useState('');
  const [resignationDate, setResignationDate] = useState('');
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('Active');
  const [overallAttendanceWithoutExcused, setOverallAttendanceWithoutExcused] = useState('0%');
  const [overallAttendanceWithExcused, setOverallAttendanceWithExcused] = useState('0%');

  // Sync form states with selected member
  useEffect(() => {
    if (member) {
      setFullName(member.fullName || '');
      setCommonName(member.commonName || '');
      setIdCardNumber(member.idCardNumber || '');
      setDob(member.dob || '');
      setGender(member.gender || 'Male');
      setRole(member.role || 'Rover');
      setAwardGoal(member.awardGoal || 'None');
      setCurrentLevel(member.currentLevel || 'Square');
      setIsNewToScouting(member.isNewToScouting ? 'Yes' : 'No');
      setLastScoutGroup(member.lastScoutGroup || '');
      setPermAddress(
        typeof member.permanentAddress === 'string' 
          ? member.permanentAddress 
          : (member.permanentAddress?.addressLine || '')
      );
      setCurrAddress(
        typeof member.currentAddress === 'string' 
          ? member.currentAddress 
          : (member.currentAddress?.addressLine || '')
      );
      setEmail(member.email || '');
      setMobileNumber(member.mobileNumber || member.phoneNumber || '');
      setPhoneNumber(member.phoneNumber || '');
      setTelegramNumber(member.telegramNumber || '');
      setTelegramTag(member.telegramTag || '');
      setWhatsappNumber(member.whatsappNumber || '');
      setInstagramTag(member.instagramTag || '');
      setEmergencyName(member.emergencyName || '');
      setEmergencyRelationship(member.emergencyRelationship || 'Parent');
      setEmergencyNumber(member.emergencyNumber || '');
      setInvestitureDate(member.investitureDate || '');
      setResignationDate(member.resignationDate || '');
      setTerm(member.term || '');
      setStatus(member.status || 'Active');
      setOverallAttendanceWithoutExcused(member.overallAttendanceWithoutExcused || '0%');
      setOverallAttendanceWithExcused(member.overallAttendanceWithExcused || '0%');
      setIsEditing(false);
      setErrorMsg(null);
      setSaveSuccess(false);
    }
  }, [member]);

  if (!member) return null;

  // Profile designated status
  const designatedStatus = (!isSecretary && (member?.status === 'Approved' || member?.status === 'Investiture'))
    ? 'Active'
    : (member?.status || 'Active');

  const calculatedTerm = calculateTermFromInvestiture(member?.investitureDate);

  const handleStatusChange = async (newStatus: string, resignationDate?: string) => {
    setUpdatingStatus(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/members/update/${member.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, resignationDate: resignationDate || '' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status.');

      setStatusMessage(`Status successfully updated to "${newStatus}".`);
      member.status = newStatus as any;
      setStatus(newStatus);
      if (newStatus === 'Resigned') {
        member.resignationDate = resignationDate || resignationDateInput;
        setResignationDate(resignationDate || resignationDateInput);
      }

      if (onStatusUpdated) {
        onStatusUpdated();
      } else if (onStatusUpdate) {
        await onStatusUpdate(member.id, newStatus, resignationDate);
      }
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || 'Unknown error'}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaveSuccess(false);
    setSaving(true);

    const updates = {
      fullName,
      commonName,
      idCardNumber,
      dob,
      gender,
      role,
      awardGoal,
      currentLevel,
      isNewToScouting: isNewToScouting === 'Yes',
      lastScoutGroup,
      permanentAddress: permAddress,
      currentAddress: currAddress,
      email,
      mobileNumber,
      phoneNumber,
      telegramNumber,
      telegramTag,
      whatsappNumber,
      instagramTag,
      investitureDate,
      resignationDate,
      term,
      status,
      overallAttendanceWithoutExcused,
      overallAttendanceWithExcused
    };

    try {
      const res = await fetch(`/api/admin/members/update/${member.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member profile details.');

      setSaveSuccess(true);
      // Update local member object immediately so UI updates
      Object.assign(member, updates);
      
      if (onStatusUpdated) {
        onStatusUpdated();
      }

      setTimeout(() => {
        setIsEditing(false);
        setSaveSuccess(false);
      }, 1200);

    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const parseAddress = (addr: any) => {
    if (!addr) return { addressLine: 'N/A', city: 'N/A', state: 'N/A', country: 'N/A', full: 'N/A' };
    if (typeof addr === 'string') {
      return { addressLine: addr, city: 'N/A', state: 'N/A', country: 'N/A', full: addr };
    }
    const addressLine = addr.addressLine || addr.address || '';
    const city = addr.city || '';
    const state = addr.state || '';
    const country = addr.country || '';
    const full = [addressLine, city, state, country].filter(Boolean).join(', ') || 'N/A';
    return {
      addressLine: addressLine || 'N/A',
      city: city || 'N/A',
      state: state || 'N/A',
      country: country || 'N/A',
      full
    };
  };

  const renderAddressText = (addr: any) => {
    if (!addr) return 'Not Provided';
    if (typeof addr === 'string') return addr;
    const parts = [addr.addressLine, addr.district, addr.city, addr.state, addr.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not Provided';
  };

  const currentAddrInfo = parseAddress(member.currentAddress || member.permanentAddress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 relative flex flex-col">
        {/* Header */}
        <div className="p-6 bg-darkblue text-white rounded-t-3xl relative">
          {isSecretary && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute right-14 top-4 px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 hover:text-white rounded-xl transition-all border border-white/20 flex items-center space-x-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-300" />
              <span>{isEditing ? 'View Profile' : 'Edit Profile'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pr-10">
            <div className="w-16 h-16 rounded-2xl bg-maroon text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
              {member.commonName ? member.commonName.charAt(0) : member.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    member.role === 'Rover' ? 'bg-sky-400 text-darkblue' : 'bg-amber-400 text-amber-950'
                  }`}
                >
                  {member.role} Member
                </span>

                {/* ID Card visible ONLY to Secretary */}
                {isSecretary && (
                  <span className="text-xs text-sky-200 font-mono">ID: {member.idCardNumber}</span>
                )}

                {/* Status Field */}
                {isSecretary ? (
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-sky-200 uppercase font-bold">Status:</span>
                    <select
                      value={member.status || 'Active'}
                      onChange={(e) => {
                        if (e.target.value !== (member.status || 'Active')) {
                          setPendingStatus(e.target.value);
                        }
                      }}
                      disabled={updatingStatus}
                      className="text-[10px] bg-white/20 border border-white/30 px-2 py-0.5 rounded-full text-white font-bold focus:outline-hidden cursor-pointer"
                    >
                      <option value="Pending Verification" className="text-gray-900">Pending Verification</option>
                      <option value="Interview & Investiture" className="text-gray-900">Interview & Investiture</option>
                      <option value="Approved" className="text-gray-900">Approved</option>
                      <option value="Active" className="text-gray-900">Active</option>
                      <option value="Voluntary Suspension" className="text-gray-900">Voluntary Suspension</option>
                      <option value="Member Suspension" className="text-gray-900">Member Suspension</option>
                      <option value="Resigned" className="text-gray-900">Resigned</option>
                      <option value="Rejected" className="text-gray-900">Rejected</option>
                    </select>
                  </div>
                ) : (
                  <span className="text-[10px] bg-emerald-500/30 border border-emerald-400/40 px-2.5 py-0.5 rounded-full text-emerald-200 font-bold">
                    Status: {designatedStatus}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {member.fullName}
              </h2>
              <p className="text-xs text-sky-200">
                Common Name: <span className="font-bold text-white">"{member.commonName || 'N/A'}"</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile changes saved successfully!</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-bold flex items-center justify-between shadow-xs animate-in fade-in">
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-black text-sm px-1.5">&times;</button>
            </div>
          )}

          {isEditing ? (
            /* ========================================== */
            /* EDITING FORM FOR SECRETARY                 */
            /* ========================================== */
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Personal Details */}
              <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-darkblue text-xs uppercase tracking-wider flex items-center space-x-2">
                  <User className="w-4 h-4 text-sky-600" />
                  <span>1. Personal & Identity Details</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-sky-100/60">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Full Name:</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Common Name:</label>
                    <input
                      type="text"
                      required
                      value={commonName}
                      onChange={(e) => setCommonName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">ID Card Number:</label>
                    <input
                      type="text"
                      required
                      value={idCardNumber}
                      onChange={(e) => setIdCardNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Date of Birth:</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Gender:</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Role / Section:</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium bg-white"
                    >
                      <option value="Rover">Rover</option>
                      <option value="Explorer">Explorer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Scouting Progression */}
              <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-amber-950 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-700" />
                  <span>2. Scouting Progression, Term & Awards</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-amber-100/60">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Award Goal:</label>
                    <select
                      value={awardGoal}
                      onChange={(e) => setAwardGoal(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon bg-white"
                    >
                      <option value="President Scout Award">President Scout Award</option>
                      <option value="Baden-Powell Award">Baden-Powell Award</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Progression Level:</label>
                    <select
                      value={currentLevel}
                      onChange={(e) => setCurrentLevel(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon bg-white"
                    >
                      <option value="Square">Square</option>
                      <option value="Scout Standard">Scout Standard</option>
                      <option value="Advanced Scout Standard">Advanced Scout Standard</option>
                      <option value="Bushman's Thong">Bushman's Thong</option>
                      <option value="President Scout Award">President Scout Award</option>
                      <option value="President Scout Award Holder">President Scout Award Holder</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">New To Scouting?</label>
                    <select
                      value={isNewToScouting}
                      onChange={(e) => setIsNewToScouting(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon bg-white font-medium"
                    >
                      <option value="Yes">Yes (New Scout)</option>
                      <option value="No">No (Prior Group)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Last Scout Group:</label>
                    <input
                      type="text"
                      value={lastScoutGroup}
                      onChange={(e) => setLastScoutGroup(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                      placeholder="e.g. 11th Male Scout Group"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Membership Term:</label>
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                      placeholder="e.g. 2024-2026"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Status:</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon bg-white font-medium"
                    >
                      <option value="Pending Verification">Pending Verification</option>
                      <option value="Interview & Investiture">Interview & Investiture</option>
                      <option value="Approved">Approved</option>
                      <option value="Active">Active</option>
                      <option value="Voluntary Suspension">Voluntary Suspension</option>
                      <option value="Member Suspension">Member Suspension</option>
                      <option value="Resigned">Resigned</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Investiture Date:</label>
                    <input
                      type="date"
                      value={investitureDate}
                      onChange={(e) => setInvestitureDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Resignation Date:</label>
                    <input
                      type="date"
                      value={resignationDate}
                      onChange={(e) => setResignationDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Channels */}
              <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>3. Contact Channels</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-emerald-100/60 font-medium">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Email Address:</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Mobile Number:</label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Phone Number (Backup):</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Telegram Number:</label>
                    <input
                      type="text"
                      value={telegramNumber}
                      onChange={(e) => setTelegramNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Telegram Tag:</label>
                    <input
                      type="text"
                      value={telegramTag}
                      onChange={(e) => setTelegramTag(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                      placeholder="e.g. @ahmed_scout"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">WhatsApp Number:</label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Instagram Tag:</label>
                    <input
                      type="text"
                      value={instagramTag}
                      onChange={(e) => setInstagramTag(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                      placeholder="e.g. @ahmed.scout"
                    />
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="bg-red-50/30 border border-red-100 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-red-950 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>4. Address Registrations</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-red-100/60 font-medium">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Permanent Address:</label>
                    <textarea
                      rows={2}
                      value={permAddress}
                      onChange={(e) => setPermAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon resize-none font-medium"
                      placeholder="Street, City, Atoll"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Current Address:</label>
                    <textarea
                      rows={2}
                      value={currAddress}
                      onChange={(e) => setCurrAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon resize-none font-medium"
                      placeholder="Street, City, Atoll"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="bg-pink-50/30 border border-pink-100 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-pink-950 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-pink-600" />
                  <span>5. Emergency Contact Details</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-pink-100/60 font-medium">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Contact Name:</label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Relationship:</label>
                    <input
                      type="text"
                      value={emergencyRelationship}
                      onChange={(e) => setEmergencyRelationship(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                      placeholder="e.g. Parent, Guardian, Sibling"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Contact Phone Number:</label>
                    <input
                      type="text"
                      value={emergencyNumber}
                      onChange={(e) => setEmergencyNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Attendance Matrix */}
              <div className="bg-purple-50/30 border border-purple-100 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-purple-950 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-purple-600" />
                  <span>6. Performance & Attendance Metrics</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-purple-100/60 font-medium">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Overall Attendance (Without Excused):</label>
                    <input
                      type="text"
                      value={overallAttendanceWithoutExcused}
                      onChange={(e) => setOverallAttendanceWithoutExcused(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                      placeholder="e.g. 85%"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">Overall Attendance (With Excused):</label>
                    <input
                      type="text"
                      value={overallAttendanceWithExcused}
                      onChange={(e) => setOverallAttendanceWithExcused(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                      placeholder="e.g. 95%"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Form Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-maroon text-white font-bold text-xs rounded-xl hover:bg-[#660000] transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>

          {/* PRIVACY NOTICE FOR ROVERS / EXPLORERS */}
          {!isSecretary && (
            <div className="p-3 bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl flex items-center space-x-2 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
              <span>
                <strong>Member Directory Profile:</strong> You are viewing authorized public member details (Full Name, Common Name, Status, Investiture Date, Gender, Date of Birth, Age, and Current Address).
              </span>
            </div>
          )}

          {/* SECTION: Core Member Profile Details */}
          <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-darkblue text-xs uppercase tracking-wider flex items-center space-x-2">
              <User className="w-4 h-4 text-maroon" />
              <span>Personal & Membership Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-gray-200 text-gray-700">
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-semibold block text-[11px]">Full Name:</span>
                <span className="font-bold text-darkblue text-xs">{member.fullName}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-semibold block text-[11px]">Common Name:</span>
                <span className="font-bold text-gray-900 text-xs">"{member.commonName || 'N/A'}"</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-semibold block text-[11px]">Status:</span>
                <span className="font-bold text-emerald-700 text-xs">{designatedStatus}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-semibold block text-[11px]">Investiture Date:</span>
                <span className="font-mono font-bold text-emerald-800 text-xs flex items-center space-x-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  <span>{member.investitureDate ? formatDateDDMMMYYYY(member.investitureDate) : 'Awaiting Date'}</span>
                </span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-semibold block text-[11px]">Gender:</span>
                <span className="font-bold text-gray-800 text-xs">{member.gender || 'Not Specified'}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-semibold block text-[11px]">Date of Birth:</span>
                <span className="font-mono font-bold text-gray-800 text-xs">{member.dob ? formatDateDDMMMYYYY(member.dob) : 'N/A'}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg sm:col-span-2 lg:col-span-3">
                <span className="text-gray-500 font-semibold block text-[11px]">Age:</span>
                <span className="font-bold text-darkblue text-xs">
                  {member.ageYears || member.age || 'N/A'} yrs {member.ageMonths ? `${member.ageMonths} mths ` : ''}{member.ageDays ? `${member.ageDays} days` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION: Current Address Information (Visible to Rovers & Explorers) */}
          <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-darkblue text-xs uppercase tracking-wider flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Current Residence & Location</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
              <div className="p-2 bg-gray-50 rounded-lg sm:col-span-2 lg:col-span-4">
                <span className="text-gray-500 font-semibold block text-[11px]">Current Address:</span>
                <span className="font-medium text-gray-800 text-xs">{currentAddrInfo.addressLine}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-semibold block text-[11px]">City / Island:</span>
                <span className="font-bold text-darkblue text-xs">{currentAddrInfo.city}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-semibold block text-[11px]">State / Atoll:</span>
                <span className="font-bold text-gray-800 text-xs">{currentAddrInfo.state}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg sm:col-span-2">
                <span className="text-gray-500 font-semibold block text-[11px]">Country:</span>
                <span className="font-bold text-gray-800 text-xs">{currentAddrInfo.country}</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECRETARY-ONLY SECTIONS (Hidden for Rovers & Explorers)                   */}
          {/* ========================================================================= */}
          {isSecretary ? (
            <>
              {/* 1. National ID & Scouting Progression */}
              <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-darkblue text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Award className="w-4 h-4 text-maroon" />
                  <span>Scouting Progression, Term & Awards (Secretary Only)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-sky-100">
                  <div>
                    <span className="text-gray-500 font-semibold block">National ID Card:</span>
                    <span className="font-mono font-bold text-darkblue text-xs">{member.idCardNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold block">Award Goal:</span>
                    <span className="font-bold text-darkblue text-xs">{member.awardGoal || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold block">Current Progression Level:</span>
                    <span className="font-bold text-darkblue text-xs">{member.currentLevel || 'Square'}</span>
                  </div>

                  {/* Term from Investiture till today */}
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-gray-500 font-semibold block text-[11px]">Membership Term (Investiture till today):</span>
                    <span className="font-bold text-darkblue text-xs">{calculatedTerm}</span>
                    {member.investitureDate && (
                      <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">From {formatDateDDMMMYYYY(member.investitureDate)} till today</span>
                    )}
                  </div>

                  {/* Time Remaining */}
                  {member.awardGoal && member.awardGoal !== 'None' && calculateTimeRemainingForAward && (
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="text-xs font-bold text-amber-900 block">
                            Time Remaining to Award Submission Deadline:
                          </span>
                          <div className="text-sm font-bold text-maroon flex items-center space-x-1.5 mt-0.5">
                            <Clock className="w-4 h-4 text-maroon shrink-0" />
                            <span>
                              {calculateTimeRemainingForAward(
                                member.dob,
                                member.role,
                                member.ageYears,
                                member.ageMonths,
                                member.ageDays,
                                member.awardGoal
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-500 sm:text-right">
                          <span>Deadline: </span>
                          <strong className="text-darkblue">1 day before {member.role === 'Explorer' ? '18th' : '26th'} birthday</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-gray-500 font-semibold block">Resignation Date:</span>
                    <span className="font-medium text-gray-700">{member.resignationDate ? formatDateDDMMMYYYY(member.resignationDate) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Attendance Stats Card */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-emerald-700" />
                  <span>Overall Attendance Performance (Secretary Only)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-gray-600">Attendance (Without Excused):</span>
                    <span className="font-black text-sm text-darkblue">
                      {member.overallAttendanceWithoutExcused || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-emerald-50/50 rounded-lg">
                    <span className="font-semibold text-emerald-900">Attendance (With Excused):</span>
                    <span className="font-black text-sm text-emerald-700">
                      {member.overallAttendanceWithExcused || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Contact Details & Permanent Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Channels */}
                <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <h4 className="font-bold text-darkblue text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Contact Channels (Secretary Only)</span>
                  </h4>
                  <div className="space-y-2 bg-white p-3 rounded-xl border border-gray-200 text-gray-700">
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="font-semibold text-gray-500">Mobile Number:</span>
                      <span className="font-mono font-bold text-gray-800">
                        {member.mobileNumber || member.phoneNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="font-semibold text-gray-500">WhatsApp:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {member.whatsappNumber || member.mobileNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="font-semibold text-gray-500">Email Address:</span>
                      <span className="font-bold text-gray-800 truncate max-w-[170px]">{member.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="font-semibold text-gray-500">Telegram:</span>
                      <span className="font-bold text-sky-700">
                        {member.telegramNumber || member.telegramTag || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-500">Instagram:</span>
                      <span className="font-bold text-pink-700">{member.instagramTag || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Permanent Address */}
                <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <h4 className="font-bold text-darkblue text-xs uppercase tracking-wider flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>Permanent Registered Address (Secretary Only)</span>
                  </h4>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2 text-gray-700">
                    <div className="text-gray-700">
                      {renderAddressText(member.permanentAddress)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Emergency Contact Details */}
              <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-maroon text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-600" />
                  <span>Emergency Contact Details (Secretary Only)</span>
                </h4>
                <div className="bg-white p-3.5 rounded-xl border border-red-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-gray-800">
                  <div>
                    <span className="text-gray-500 font-semibold block">Contact Name:</span>
                    <span className="font-bold text-darkblue">{member.emergencyName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold block">Relationship:</span>
                    <span className="font-bold text-maroon">{member.emergencyRelationship || 'Parent / Guardian'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold block">Emergency Phone:</span>
                    <span className="font-mono font-bold text-gray-900">{member.emergencyNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-between text-gray-400 text-[11px]">
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span>Confidential contact information, ID card number, and emergency contacts are protected.</span>
              </div>
              <span className="font-bold text-gray-500 text-[10px] uppercase">Council Protected</span>
            </div>
          )}
        </>
      )}
    </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-3xl flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-darkblue text-white font-bold text-xs rounded-xl hover:bg-blue-900 transition-colors shadow-xs"
          >
            Close Member Profile
          </button>
        </div>
      </div>

      {/* Confirmation Popup Modal */}
      {pendingStatus && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-black flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-darkblue">Confirm Status Change</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to change membership status for <span className="font-bold text-gray-900">{member.fullName}</span> to <span className="font-bold text-maroon">"{pendingStatus}"</span>?
            </p>
            {pendingStatus === 'Resigned' && (
              <div className="text-left space-y-1 pt-1">
                <label className="text-[11px] font-bold text-gray-700 block">Resignation Date (Required):</label>
                <input
                  type="date"
                  value={resignationDateInput}
                  onChange={(e) => setResignationDateInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-maroon font-medium"
                />
                <p className="text-[10px] text-gray-500">Resigned member records are held for 30 days before auto-deletion.</p>
              </div>
            )}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setPendingStatus(null)}
                className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const statusToSet = pendingStatus;
                  const resDate = resignationDateInput;
                  setPendingStatus(null);
                  handleStatusChange(statusToSet, resDate);
                }}
                className="flex-1 py-2.5 bg-darkblue text-white font-bold text-xs rounded-xl hover:bg-blue-900 transition-colors shadow-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
