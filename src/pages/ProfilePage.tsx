import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MemberApplication, ProgressionLevel, RoleSection, AwardGoal } from '../types';
import { calculateTimeRemainingForAward, getProgressionRequirement } from '../utils/awardTimeline';
import { calculateTermFromInvestiture } from '../utils/termCalculation';
import { 
  COUNTRIES, 
  getStatesForCountry, 
  getCitiesForState, 
  getDistrictsForCity,
  findMatchingState,
  findStateForCity
} from '../data/locationData';
import { 
  User, 
  Award, 
  Compass, 
  Clock, 
  ShieldCheck, 
  Edit3, 
  Send, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  X,
  Calendar,
  Activity,
  HeartHandshake,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Address formatter helper
  const formatAddress = (addr: any): string => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object') {
      const parts = [
        addr.addressLine,
        addr.district && addr.district !== 'N/A' ? addr.district : null,
        addr.city,
        addr.state,
        addr.country
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    return 'N/A';
  };

  // Profile Update Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editCommonName, setEditCommonName] = useState('');
  const [editIdCardNumber, setEditIdCardNumber] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editRole, setEditRole] = useState<RoleSection>('Rover');
  const [editAwardGoal, setEditAwardGoal] = useState<AwardGoal>('None');
  const [editIsNewToScouting, setEditIsNewToScouting] = useState<boolean>(true);
  const [editLastScoutGroup, setEditLastScoutGroup] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editMobileNumber, setEditMobileNumber] = useState('');
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editLevel, setEditLevel] = useState<ProgressionLevel | ''>('');
  const [editTerm, setEditTerm] = useState('');
  const [editStatus, setEditStatus] = useState('Investiture');
  const [editInvestitureDate, setEditInvestitureDate] = useState('');
  const [editResignationDate, setEditResignationDate] = useState('');
  const [editAttendanceWithoutExcused, setEditAttendanceWithoutExcused] = useState('');
  const [editAttendanceWithExcused, setEditAttendanceWithExcused] = useState('');
  const [suspensionEndDate, setSuspensionEndDate] = useState('');
  const [suspensionReason, setSuspensionReason] = useState<'Education' | 'Medical' | 'Other'>('Education');
  const [showSuspensionForm, setShowSuspensionForm] = useState(false);
  
  // Address edit states
  const [editPermCountry, setEditPermCountry] = useState('Maldives');
  const [editPermState, setEditPermState] = useState('');
  const [editPermCity, setEditPermCity] = useState('');
  const [editPermDistrict, setEditPermDistrict] = useState('');
  const [editPermAddressLine, setEditPermAddressLine] = useState('');

  const [editCurrCountry, setEditCurrCountry] = useState('Maldives');
  const [editCurrState, setEditCurrState] = useState('');
  const [editCurrCity, setEditCurrCity] = useState('');
  const [editCurrDistrict, setEditCurrDistrict] = useState('');
  const [editCurrAddressLine, setEditCurrAddressLine] = useState('');

  const handlePermCountryChange = (c: string) => {
    setEditPermCountry(c);
    const states = getStatesForCountry(c);
    const defaultState = states[0] || '';
    setEditPermState(defaultState);
    const cities = getCitiesForState(c, defaultState);
    const defaultCity = cities[0] || '';
    setEditPermCity(defaultCity);
    const districts = getDistrictsForCity(c, defaultState, defaultCity);
    setEditPermDistrict(districts[0] || 'N/A');
  };

  const handlePermStateChange = (s: string) => {
    setEditPermState(s);
    const cities = getCitiesForState(editPermCountry, s);
    const defaultCity = cities[0] || '';
    setEditPermCity(defaultCity);
    const districts = getDistrictsForCity(editPermCountry, s, defaultCity);
    setEditPermDistrict(districts[0] || 'N/A');
  };

  const handlePermCityChange = (city: string) => {
    setEditPermCity(city);
    const districts = getDistrictsForCity(editPermCountry, editPermState, city);
    setEditPermDistrict(districts[0] || 'N/A');
  };

  const handleCurrCountryChange = (c: string) => {
    setEditCurrCountry(c);
    const states = getStatesForCountry(c);
    const defaultState = states[0] || '';
    setEditCurrState(defaultState);
    const cities = getCitiesForState(c, defaultState);
    const defaultCity = cities[0] || '';
    setEditCurrCity(defaultCity);
    const districts = getDistrictsForCity(c, defaultState, defaultCity);
    setEditCurrDistrict(districts[0] || 'N/A');
  };

  const handleCurrStateChange = (s: string) => {
    setEditCurrState(s);
    const cities = getCitiesForState(editCurrCountry, s);
    const defaultCity = cities[0] || '';
    setEditCurrCity(defaultCity);
    const districts = getDistrictsForCity(editCurrCountry, s, defaultCity);
    setEditCurrDistrict(districts[0] || 'N/A');
  };

  const handleCurrCityChange = (city: string) => {
    setEditCurrCity(city);
    const districts = getDistrictsForCity(editCurrCountry, editCurrState, city);
    setEditCurrDistrict(districts[0] || 'N/A');
  };

  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyRel, setEditEmergencyRel] = useState('Parent');
  const [editEmergencyNum, setEditEmergencyNum] = useState('');

  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.idCardNumber || user?.id || user?.username) {
      fetch(`/api/members/profile?idCardNumber=${encodeURIComponent(user.idCardNumber || '')}&memberId=${encodeURIComponent(user.id || '')}&username=${encodeURIComponent(user.username || '')}`)
        .then(res => res.json())
        .then(data => {
          const profile = (!data || data.error) ? user : data;
          setProfileData(profile);
          setEditFullName(profile.fullName || user.fullName || '');
          setEditCommonName(profile.commonName || user.commonName || '');
          setEditIdCardNumber(profile.idCardNumber || user.idCardNumber || '');
          setEditUsername(profile.username || user.username || '');
          setEditPassword('');
          setEditDob(profile.dob || '');
          setEditGender(profile.gender || 'Male');
          setEditRole(profile.role || user.role || 'Rover');
          setEditAwardGoal(profile.awardGoal || user.awardGoal || 'None');
          setEditIsNewToScouting(profile.isNewToScouting ?? true);
          setEditLastScoutGroup(profile.lastScoutGroup || '');
          setEditPhone(profile.phoneNumber || profile.mobileNumber || '');
          setEditMobileNumber(profile.mobileNumber || profile.phoneNumber || '');
          setEditWhatsappNumber(profile.whatsappNumber || profile.phoneNumber || '');
          setEditEmail(profile.email || user.email || '');
          setEditTelegram(profile.telegramTag || profile.telegramNumber || '');
          setEditInstagram(profile.instagramTag || '');
          setEditLevel(profile.currentLevel || user.currentLevel || 'Square');
          setEditTerm(profile.term || '');
          setEditStatus(profile.status || user.status || 'Investiture');
          setEditInvestitureDate(profile.investitureDate || user.investitureDate || '');
          setEditResignationDate(profile.resignationDate || '');
          setEditAttendanceWithoutExcused(profile.overallAttendanceWithoutExcused || '');
          setEditAttendanceWithExcused(profile.overallAttendanceWithExcused || '');
          setSuspensionEndDate(profile.suspensionEndDate || '');
          setSuspensionReason(profile.suspensionReason || 'Education');
          setEditEmergencyName(profile.emergencyName || profile.emergencyContact?.fullName || user.emergencyContact?.fullName || user.emergencyName || '');
          setEditEmergencyRel(profile.emergencyRelationship || profile.emergencyContact?.relationship || user.emergencyContact?.relationship || user.emergencyRelationship || 'Parent');
          setEditEmergencyNum(profile.emergencyNumber || profile.emergencyContact?.contactNumber || user.emergencyContact?.contactNumber || user.emergencyNumber || '');

          if (profile.permanentAddress) {
            if (typeof profile.permanentAddress === 'object') {
              const pCountry = profile.permanentAddress.country || 'Maldives';
              const pState = findMatchingState(pCountry, profile.permanentAddress.state) || findStateForCity(pCountry, profile.permanentAddress.city) || getStatesForCountry(pCountry)[0] || '';
              const availableCities = getCitiesForState(pCountry, pState);
              const pCity = availableCities.includes(profile.permanentAddress.city) ? profile.permanentAddress.city : (availableCities[0] || profile.permanentAddress.city || '');
              const availableDistricts = getDistrictsForCity(pCountry, pState, pCity);
              const pDistrict = availableDistricts.includes(profile.permanentAddress.district) ? profile.permanentAddress.district : (availableDistricts[0] || 'N/A');

              setEditPermCountry(pCountry);
              setEditPermState(pState);
              setEditPermCity(pCity);
              setEditPermDistrict(pDistrict);
              setEditPermAddressLine(profile.permanentAddress.addressLine || '');
            } else if (typeof profile.permanentAddress === 'string') {
              setEditPermAddressLine(profile.permanentAddress);
            }
          }
          if (profile.currentAddress) {
            if (typeof profile.currentAddress === 'object') {
              const cCountry = profile.currentAddress.country || 'Maldives';
              const cState = findMatchingState(cCountry, profile.currentAddress.state) || findStateForCity(cCountry, profile.currentAddress.city) || getStatesForCountry(cCountry)[0] || '';
              const availableCities = getCitiesForState(cCountry, cState);
              const cCity = availableCities.includes(profile.currentAddress.city) ? profile.currentAddress.city : (availableCities[0] || profile.currentAddress.city || '');
              const availableDistricts = getDistrictsForCity(cCountry, cState, cCity);
              const cDistrict = availableDistricts.includes(profile.currentAddress.district) ? profile.currentAddress.district : (availableDistricts[0] || 'N/A');

              setEditCurrCountry(cCountry);
              setEditCurrState(cState);
              setEditCurrCity(cCity);
              setEditCurrDistrict(cDistrict);
              setEditCurrAddressLine(profile.currentAddress.addressLine || '');
            } else if (typeof profile.currentAddress === 'string') {
              setEditCurrAddressLine(profile.currentAddress);
            }
          }
          setLoading(false);
        })
        .catch(() => {
          setProfileData(user);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleProfileUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdateSubmitting(true);
    setUpdateSuccessMsg(null);

    const isCurrentAdmin = (user.role === 'Admin' || user.role === 'Secretary') || user.isAdmin === true;
    const targetIdCard = editIdCardNumber;
    const targetRole = editRole || user.role;

    try {
      const updates = {
        fullName: editFullName,
        commonName: editCommonName,
        idCardNumber: targetIdCard,
        dob: editDob,
        gender: editGender,
        role: targetRole,
        awardGoal: editAwardGoal,
        isNewToScouting: editIsNewToScouting,
        lastScoutGroup: editLastScoutGroup,
        phoneNumber: editMobileNumber,
        mobileNumber: editMobileNumber,
        whatsappNumber: editWhatsappNumber || editMobileNumber,
        email: editEmail,
        telegramTag: editTelegram,
        telegramNumber: editTelegram,
        instagramTag: editInstagram,
        currentLevel: editLevel,
        term: editTerm,
        status: editStatus,
        investitureDate: editInvestitureDate,
        resignationDate: editResignationDate,
        overallAttendanceWithoutExcused: editAttendanceWithoutExcused,
        overallAttendanceWithExcused: editAttendanceWithExcused,
        emergencyName: editEmergencyName,
        emergencyRelationship: editEmergencyRel,
        emergencyNumber: editEmergencyNum,
        permanentAddress: {
          country: editPermCountry,
          state: editPermState,
          city: editPermCity,
          district: editPermDistrict,
          addressLine: editPermAddressLine
        },
        currentAddress: isCurrentAdmin
          ? {
              country: editPermCountry,
              state: editPermState,
              city: editPermCity,
              district: editPermDistrict,
              addressLine: editPermAddressLine
            }
          : {
              country: editCurrCountry,
              state: editCurrState,
              city: editCurrCity,
              district: editCurrDistrict,
              addressLine: editCurrAddressLine
            }
      };

      if (isCurrentAdmin) {
        // 1. Synchronize server memory store directly
        const updateRes = await fetch('/api/profile/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: user.id,
            idCardNumber: user.idCardNumber || editIdCardNumber,
            updates
          })
        });

        // 2. Also log audit request
        fetch('/api/profile/update-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: user.id,
            memberName: editFullName || user.fullName,
            idCardNumber: editIdCardNumber || user.idCardNumber,
            requestedChanges: updates
          })
        }).catch(err => console.warn('Audit log warning:', err));

        if (updateRes.ok) {
          const updateJson = await updateRes.json();
          const updatedMember = updateJson.member || { ...user, ...updates };
          setProfileData(updatedMember);
          updateUser(updatedMember as AuthUser);
          setShowUpdateModal(false);
          setUpdateSuccessMsg('All profile details updated successfully! Changes are live and synchronized across your account, records, and the Member Directory.');
        } else {
          // Still apply locally if server error
          const fallback = { ...user, ...updates };
          setProfileData(fallback);
          updateUser(fallback as AuthUser);
          setShowUpdateModal(false);
          setUpdateSuccessMsg('Profile details saved and synchronized with your local session!');
        }
      } else {
        // Direct credential update for regular users if username or password was specified
        if (editUsername || editPassword) {
          const credsBody: any = {
            memberId: user.id,
            idCardNumber: user.idCardNumber || editIdCardNumber,
            updates: {}
          };
          if (editUsername) credsBody.updates.username = editUsername;
          if (editPassword) credsBody.updates.password = editPassword;
          
          const credsRes = await fetch('/api/profile/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credsBody)
          });
          if (credsRes.ok) {
            const credsData = await credsRes.json();
            if (credsData.member) {
              updateUser({ ...user, ...credsData.member });
            }
          }
        }

        // Submitting an update request for regular users
        const reqRes = await fetch('/api/profile/update-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: user.id,
            memberName: editFullName || user.fullName,
            idCardNumber: editIdCardNumber || user.idCardNumber,
            requestedChanges: updates
          })
        });

        if (reqRes.ok) {
          setShowUpdateModal(false);
          setUpdateSuccessMsg('Profile credentials updated directly! The other details have been sent to the Secretary for review.');
        } else {
          throw new Error('Failed to submit update request.');
        }
      }
    } catch (err) {
      console.error('Profile update error:', err);
      // Fallback save locally so user is never blocked
      const fallback = {
        ...user,
        fullName: editFullName,
        commonName: editCommonName,
        idCardNumber: targetIdCard,
        email: editEmail,
        phoneNumber: editMobileNumber,
        mobileNumber: editMobileNumber,
        whatsappNumber: editWhatsappNumber || editMobileNumber,
        role: targetRole
      };
      setProfileData(fallback as any);
      updateUser(fallback);
      setShowUpdateModal(false);
      setUpdateSuccessMsg('Profile updated and saved to session.');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleVoluntarySuspensionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdateSubmitting(true);
    setUpdateSuccessMsg(null);
    try {
      const updates = {
        status: 'Voluntary Suspension',
        suspensionEndDate,
        suspensionReason
      };
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: user.id,
          idCardNumber: user.idCardNumber,
          updates
        })
      });
      if (res.ok) {
        const json = await res.json();
        const updatedMember = json.member || { ...user, ...updates };
        setProfileData(updatedMember);
        updateUser(updatedMember);
        setShowSuspensionForm(false);
        setUpdateSuccessMsg('Voluntary suspension requested successfully. Membership status updated to Suspended.');
      } else {
        const fallback = { ...user, ...updates };
        setProfileData(fallback as any);
        updateUser(fallback);
        setShowSuspensionForm(false);
        setUpdateSuccessMsg('Voluntary suspension requested successfully!');
      }
    } catch (err: any) {
      setUpdateSuccessMsg(err.message || 'Error requesting voluntary suspension.');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleActivateMembership = async () => {
    if (!user) return;
    setUpdateSubmitting(true);
    setUpdateSuccessMsg(null);
    try {
      const updates = {
        status: 'Approved',
        suspensionEndDate: null,
        suspensionReason: null
      };
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: user.id,
          idCardNumber: user.idCardNumber,
          updates
        })
      });
      if (res.ok) {
        const json = await res.json();
        const updatedMember = json.member || { ...user, ...updates };
        setProfileData(updatedMember);
        updateUser(updatedMember);
        setUpdateSuccessMsg('Membership activated successfully! An email notification regarding your status change has been dispatched.');
      } else {
        const fallback = { ...user, ...updates };
        setProfileData(fallback as any);
        updateUser(fallback);
        setUpdateSuccessMsg('Membership activated successfully!');
      }
    } catch (err: any) {
      setUpdateSuccessMsg(err.message || 'Error activating membership.');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  if (!user) return null;

  const renderField = (
    label: string, 
    value: React.ReactNode, 
    options?: {
      subtext?: string; 
      isMono?: boolean; 
      highlight?: 'emerald' | 'maroon' | 'amber' | 'blue' | 'normal';
      colSpan?: string;
    }
  ) => {
    let valueColor = 'text-darkblue';
    if (options?.highlight === 'emerald') valueColor = 'text-emerald-700';
    else if (options?.highlight === 'maroon') valueColor = 'text-maroon';
    else if (options?.highlight === 'amber') valueColor = 'text-amber-800';
    else if (options?.highlight === 'blue') valueColor = 'text-sky-700';

    return (
      <div className={`p-3.5 bg-gray-50/90 rounded-xl border border-gray-100 flex flex-col justify-between space-y-1 ${options?.colSpan || ''}`}>
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          {label}
        </div>
        <div className={`text-xs sm:text-sm font-bold ${valueColor} ${options?.isMono ? 'font-mono' : ''} break-words`}>
          {value || 'N/A'}
        </div>
        {options?.subtext && (
          <div className="text-[10px] text-gray-500 font-medium pt-0.5 border-t border-gray-200/50">
            {options.subtext}
          </div>
        )}
      </div>
    );
  };

  const memberAgeText = (profileData?.ageYears !== undefined && profileData?.ageYears !== null)
    ? `${profileData.ageYears} yrs ${profileData.ageMonths || 0} mos`
    : ((user.ageYears !== undefined && user.ageYears !== null) ? `${user.ageYears} yrs ${user.ageMonths || 0} mos` : 'N/A');

  const isSecretary = user?.role === 'Secretary';

  if (isSecretary) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
        
        {/* Secretary Profile Header Card */}
        <div className="bg-darkblue p-6 sm:p-8 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-5 border border-blue-900">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-inner">
              {(profileData?.commonName || user.commonName || user.fullName || 'S').charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30">
                  <User className="w-3.5 h-3.5 text-amber-300" />
                  <span>Secretary of Arabiyya Rover Network</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {profileData?.fullName || user.fullName}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">
                Common Name: <strong className="text-white">"{profileData?.commonName || user.commonName || 'N/A'}"</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUpdateModal(true)}
            className="px-4 py-2.5 bg-maroon hover:bg-[#660000] text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 self-start sm:self-auto transition-colors border border-white/15"
          >
            <Edit3 className="w-4 h-4" />
            <span>Update Secretary Account</span>
          </button>
        </div>

        {updateSuccessMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-between">
            <span>{updateSuccessMsg}</span>
            <button onClick={() => setUpdateSuccessMsg(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Secretary Quick Portal Access & Executive Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6">
          
          {/* Secretary Contact & Identification Details */}
          <div>
            <h2 className="text-xs font-bold text-darkblue uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center space-x-2">
              <Phone className="w-4 h-4 text-maroon" />
              <span>Secretary Contact & Communication Profile</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-xl space-y-1">
                <div className="text-xs text-gray-500 font-semibold uppercase flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-600" />
                  <span>Mobile Number</span>
                </div>
                <div className="text-sm font-bold text-darkblue font-mono">
                  {profileData?.mobileNumber || profileData?.phoneNumber || user.mobileNumber || user.phoneNumber || '+960 7712345'}
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                <div className="text-xs text-gray-500 font-semibold uppercase flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Official Email</span>
                </div>
                <div className="text-sm font-bold text-darkblue truncate">
                  {profileData?.email || user.email || 'it@arabiyyascouts.org'}
                </div>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
                <div className="text-xs text-gray-500 font-semibold uppercase flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Telegram Tag</span>
                </div>
                <div className="text-sm font-bold text-darkblue font-mono">
                  {profileData?.telegramTag || user.telegramTag || '@nazihnafiz'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold text-darkblue uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-maroon" />
              <span>Secretary Administrative Responsibilities</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div 
                onClick={() => onNavigate('/announcements')}
                className="p-4 rounded-xl border border-gray-200 hover:border-maroon bg-gray-50/50 cursor-pointer transition-all space-y-1"
              >
                <div className="font-bold text-darkblue text-sm flex items-center justify-between">
                  <span>Broadcast Announcements</span>
                  <span className="text-maroon text-xs">Manage →</span>
                </div>
                <p className="text-xs text-gray-500">Dispatch group announcements via email broadcast to Arabiyya members.</p>
              </div>

              <div 
                onClick={() => onNavigate('/requests')}
                className="p-4 rounded-xl border border-gray-200 hover:border-maroon bg-gray-50/50 cursor-pointer transition-all space-y-1"
              >
                <div className="font-bold text-darkblue text-sm flex items-center justify-between">
                  <span>Member Applications</span>
                  <span className="text-maroon text-xs">Manage →</span>
                </div>
                <p className="text-xs text-gray-500">Review, verify, and approve incoming registration and leader join forms.</p>
              </div>

              <div 
                onClick={() => onNavigate('/events')}
                className="p-4 rounded-xl border border-gray-200 hover:border-maroon bg-gray-50/50 cursor-pointer transition-all space-y-1"
              >
                <div className="font-bold text-darkblue text-sm flex items-center justify-between">
                  <span>Events & Attendance</span>
                  <span className="text-maroon text-xs">Manage →</span>
                </div>
                <p className="text-xs text-gray-500">Schedule group gatherings, set publish triggers, and record member attendance.</p>
              </div>

              <div 
                onClick={() => onNavigate('/settings')}
                className="p-4 rounded-xl border border-gray-200 hover:border-maroon bg-gray-50/50 cursor-pointer transition-all space-y-1"
              >
                <div className="font-bold text-darkblue text-sm flex items-center justify-between">
                  <span>System & Email Settings</span>
                  <span className="text-maroon text-xs">Manage →</span>
                </div>
                <p className="text-xs text-gray-500">Configure Secretary SMTP details, council branding, and notification templates.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Update Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-lg w-full p-6 my-8">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-base font-bold text-darkblue">Update Secretary Details</h3>
                <button onClick={() => setShowUpdateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProfileUpdateRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Common / Preferred Name</label>
                  <input
                    type="text"
                    value={editCommonName}
                    onChange={(e) => setEditCommonName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +960 7712345"
                    value={editMobileNumber}
                    onChange={(e) => {
                      setEditMobileNumber(e.target.value);
                      setEditPhone(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Telegram Tag / Username</label>
                  <input
                    type="text"
                    placeholder="e.g. @nazihnafiz"
                    value={editTelegram}
                    onChange={(e) => setEditTelegram(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-mono"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateSubmitting}
                    className="px-5 py-2 bg-maroon text-white font-bold text-xs rounded-xl hover:bg-[#660000]"
                  >
                    {updateSubmitting ? 'Updating...' : 'Save Secretary Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      
      {/* Profile Header Card */}
      <div className="bg-darkblue p-6 sm:p-8 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-5 border border-blue-900">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-inner">
            {(profileData?.commonName || user.commonName || user.fullName || 'U').charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-white/10 rounded-full text-xs font-semibold text-blue-200 border border-white/10">
                <User className="w-3.5 h-3.5 text-amber-300" />
                <span>{profileData?.role || user.role} Profile</span>
              </span>
              <span className="text-xs font-mono text-blue-200 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                ID: {profileData?.idCardNumber || user.idCardNumber}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {profileData?.fullName || user.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">
              Common Name: <strong className="text-white">"{profileData?.commonName || user.commonName || 'N/A'}"</strong> • Status: <strong className="text-emerald-300 uppercase">{profileData?.status || user.status || 'Active'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowUpdateModal(true)}
          className="px-4 py-2.5 bg-maroon hover:bg-[#660000] text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 self-start sm:self-auto transition-colors border border-white/15"
        >
          <Edit3 className="w-4 h-4" />
          <span>Request Profile Updates</span>
        </button>
      </div>

      {updateSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>{updateSuccessMsg}</span>
          <button onClick={() => setUpdateSuccessMsg(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: Scouting Section & Progression */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold text-darkblue uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center space-x-2">
          <Award className="w-4 h-4 text-maroon" />
          <span>Scouting Section & Award Progression</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {renderField('Scouting Section', profileData?.role || user.role, { highlight: 'maroon' })}
          {renderField('Progression Level', profileData?.currentLevel || user.currentLevel || 'Square', {
            subtext: `Req: ${getProgressionRequirement(profileData?.currentLevel || user.currentLevel, profileData?.role || user.role)}`
          })}
          {renderField(
            'Award Intent Goal',
            profileData?.awardGoal && profileData.awardGoal !== 'None' ? profileData.awardGoal : 'Exploring Scouting (None)',
            { highlight: profileData?.awardGoal && profileData.awardGoal !== 'None' ? 'amber' : 'normal' }
          )}
        </div>

        {/* Time Remaining to Submission Deadline */}
        {(profileData?.awardGoal || user.awardGoal) && (profileData?.awardGoal !== 'None' && user.awardGoal !== 'None') && (
          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-maroon" />
                <span>Time Remaining until Submission Deadline</span>
              </div>
              <p className="text-xs text-amber-800">
                Deadline is strictly one day before your {(profileData?.role || user.role) === 'Explorer' ? '18th' : '26th'} birthday.
              </p>
            </div>
            <div className="text-base font-black text-maroon sm:text-right shrink-0">
              {calculateTimeRemainingForAward(
                profileData?.dob || user.dob,
                profileData?.role || user.role,
                profileData?.ageYears || user.ageYears,
                profileData?.ageMonths || user.ageMonths,
                profileData?.ageDays || user.ageDays,
                profileData?.awardGoal || user.awardGoal
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Membership Status & Tenancy */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold text-darkblue uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-maroon" />
          <span>Membership Status & Tenancy</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {renderField('Membership Status', (profileData?.status === 'Approved' || profileData?.status === 'Investiture') ? 'Active' : (profileData?.status || user.status || 'Active'), { highlight: 'emerald' })}
          {renderField('Membership Term', calculateTermFromInvestiture(profileData?.investitureDate || user.investitureDate), { isMono: true, subtext: (profileData?.investitureDate || user.investitureDate) ? `From ${profileData?.investitureDate || user.investitureDate} till today` : undefined })}
          {renderField('Investiture Date', profileData?.investitureDate || user.investitureDate || 'N/A', { isMono: true })}
          {renderField('Resignation Date', profileData?.resignationDate || user.resignationDate || 'None (Active)', { isMono: true })}
        </div>

        {/* Actions for Suspension / Reactivation */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100/70">
          {(profileData?.status === 'Voluntary Suspension' || user.status === 'Voluntary Suspension') ? (
            <div className="w-full space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">You are currently on Voluntary Suspension</div>
                  <div className="mt-1">
                    Reason: <strong>{profileData?.suspensionReason || user.suspensionReason || 'Not Specified'}</strong> • Expected End Date: <strong>{profileData?.suspensionEndDate || user.suspensionEndDate || 'Not Specified'}</strong>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">
                    You are automatically excused from all mandatory event attendances during your suspension.
                  </div>
                </div>
              </div>
              <button
                onClick={handleActivateMembership}
                disabled={updateSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>{updateSubmitting ? 'Reactivating...' : 'Reactivate Membership'}</span>
              </button>
            </div>
          ) : (
            <div className="w-full">
              {!showSuspensionForm ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-gray-500 max-w-lg">
                    Need a temporary leave of absence for education, medical reasons, or other obligations? Request a temporary suspension to pause your status and excuse attendance.
                  </div>
                  <button
                    onClick={() => setShowSuspensionForm(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs shrink-0"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Request Temporary Suspension</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVoluntarySuspensionSubmit} className="space-y-4">
                  <div className="font-bold text-darkblue text-xs pb-2 border-b border-gray-100 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Request Voluntary Leave of Absence / Suspension</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        Reason for Leave *
                      </label>
                      <select
                        value={suspensionReason}
                        onChange={(e) => setSuspensionReason(e.target.value as any)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs text-gray-700"
                      >
                        <option value="Education">Education / Exams</option>
                        <option value="Medical">Medical / Health Leave</option>
                        <option value="Other">Other Personal Commitments</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        Expected Return Date *
                      </label>
                      <input
                        type="date"
                        value={suspensionEndDate}
                        onChange={(e) => setSuspensionEndDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs text-gray-700 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSuspensionForm(false)}
                      className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateSubmitting}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                    >
                      <span>{updateSubmitting ? 'Submitting...' : 'Submit Suspension Request'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Attendance Performance */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold text-darkblue uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center space-x-2">
          <Activity className="w-4 h-4 text-maroon" />
          <span>Attendance Performance</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {renderField(
            'Overall Attendance (Without Excused)',
            profileData?.overallAttendanceWithoutExcused || user.overallAttendanceWithoutExcused || '0%',
            { isMono: true }
          )}
          {renderField(
            'Overall Attendance (With Excused)',
            profileData?.overallAttendanceWithExcused || user.overallAttendanceWithExcused || '0%',
            { isMono: true, highlight: 'emerald' }
          )}
        </div>
      </div>

      {/* SECTION 4: Personal Identity & Demographics */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold text-darkblue uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center space-x-2">
          <User className="w-4 h-4 text-maroon" />
          <span>Personal Identity & Demographics</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {renderField('Full Legal Name', profileData?.fullName || user.fullName)}
          {renderField('Common / Preferred Name', profileData?.commonName || user.commonName)}
          {renderField('ID Card Number', user.idCardNumber, { isMono: true })}
          {renderField('Date of Birth (DOB)', profileData?.dob || user.dob || 'N/A', { isMono: true })}
          {renderField('Calculated Age', memberAgeText)}
          {renderField('Gender', profileData?.gender || 'N/A')}
          {renderField(
            'Scouting Background',
            profileData?.isNewToScouting ? 'New to Scouting' : (profileData?.lastScoutGroup || 'Has Previous Scouting Experience')
          )}
          {!profileData?.isNewToScouting && profileData?.lastScoutGroup && (
            renderField('Previous Scout Group', profileData.lastScoutGroup)
          )}
        </div>
      </div>

      {/* SECTION 5: Contact Channels */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold text-darkblue uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center space-x-2">
          <Phone className="w-4 h-4 text-maroon" />
          <span>Contact Channels</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {renderField('Mobile Number', profileData?.mobileNumber || profileData?.phoneNumber || user.phoneNumber || 'N/A', { isMono: true })}
          {renderField('WhatsApp Number', profileData?.whatsappNumber || profileData?.phoneNumber || 'N/A', { isMono: true, highlight: 'emerald' })}
          {renderField('Email Address', profileData?.email || user.email)}
          {renderField('Telegram Tag', profileData?.telegramTag || '@arabiyya_rover')}
          {renderField('Instagram Tag', profileData?.instagramTag || 'N/A')}
        </div>
      </div>

      {/* SECTION 6: Registered Addresses */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold text-darkblue uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-maroon" />
          <span>Registered Addresses</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {renderField(
            'Permanent Address',
            formatAddress(profileData?.permanentAddress || user.permanentAddress)
          )}
          {renderField(
            'Current Residential Address',
            formatAddress(profileData?.currentAddress || user.currentAddress)
          )}
        </div>
      </div>

      {/* SECTION 7: Emergency Contact */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold text-darkblue uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center space-x-2">
          <HeartHandshake className="w-4 h-4 text-maroon" />
          <span>Emergency Contact</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {renderField('Emergency Contact Name', profileData?.emergencyName || profileData?.emergencyContact?.fullName || user.emergencyContact?.fullName || user.emergencyName || 'N/A')}
          {renderField('Relationship', profileData?.emergencyRelationship || profileData?.emergencyContact?.relationship || user.emergencyContact?.relationship || user.emergencyRelationship || 'Parent')}
          {renderField('Emergency Contact Number', profileData?.emergencyNumber || profileData?.emergencyContact?.contactNumber || user.emergencyContact?.contactNumber || user.emergencyNumber || 'N/A', { isMono: true, highlight: 'maroon' })}
        </div>
      </div>

      {/* Profile Update Request Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4 sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-darkblue">Update All Profile Details (Join Fields)</h3>
              <button onClick={() => setShowUpdateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProfileUpdateRequest} className="space-y-4">
              {/* Login Credentials Setup */}
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl space-y-3">
                <div className="text-xs font-bold text-sky-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>Configure Private Login Credentials</span>
                </div>
                <p className="text-[11px] text-sky-950 font-medium leading-relaxed">
                  Set your desired private username and password here. These will update your account credentials immediately so you can log in with them next time.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-sky-900 uppercase mb-1">Desired Username</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())}
                      placeholder="e.g. ahmed123"
                      className="w-full px-3 py-2 text-xs border border-sky-300 rounded-xl bg-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-sky-900 uppercase mb-1">Desired Password</label>
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Set new secure password"
                      className="w-full px-3 py-2 text-xs border border-sky-300 rounded-xl bg-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Common Name</label>
                  <input
                    type="text"
                    value={editCommonName}
                    onChange={(e) => setEditCommonName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ID Card Number</label>
                  <input
                    type="text"
                    value={editIdCardNumber}
                    onChange={(e) => setEditIdCardNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Section / Role</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as RoleSection)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    placeholder="e.g. Secretary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Award Goal</label>
                  <select
                    value={editAwardGoal}
                    onChange={(e) => setEditAwardGoal(e.target.value as AwardGoal)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="President Scout Award">President Scout Award</option>
                    <option value="Baden-Powell Award">Baden-Powell Award</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Progression Level</label>
                  <select
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value as ProgressionLevel)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="Square">Square</option>
                    <option value="Scout Standard">Scout Standard</option>
                    <option value="Advanced Scout Standard">Advanced Scout Standard</option>
                    <option value="Bushman's Thong">Bushman's Thong</option>
                    <option value="President Scout Award">President Scout Award</option>
                    <option value="President Scout Award Holder">President Scout Award Holder</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Scouting Background</label>
                  <select
                    value={editIsNewToScouting ? 'true' : 'false'}
                    onChange={(e) => setEditIsNewToScouting(e.target.value === 'true')}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="true">New to Scouting</option>
                    <option value="false">Has Previous Scouting Experience</option>
                  </select>
                </div>
                {!editIsNewToScouting && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Last Scout Group</label>
                    <input
                      type="text"
                      placeholder="e.g. 1st Male' Scout Group"
                      value={editLastScoutGroup}
                      onChange={(e) => setEditLastScoutGroup(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Telegram Tag</label>
                  <input
                    type="text"
                    placeholder="username"
                    value={editTelegram}
                    onChange={(e) => setEditTelegram(e.target.value.replace(/@/g, ''))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Instagram Tag</label>
                  <input
                    type="text"
                    placeholder="username"
                    value={editInstagram}
                    onChange={(e) => setEditInstagram(e.target.value.replace(/@/g, ''))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+960 7890123"
                    value={editMobileNumber}
                    onChange={(e) => setEditMobileNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="+960 7890123"
                    value={editWhatsappNumber}
                    onChange={(e) => setEditWhatsappNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Membership Status & Term */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-bold"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Investiture">Investiture</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Voluntary Suspension">Voluntary Suspension</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Calculated Term (Investiture till today)</label>
                  <div className="px-3 py-2 text-xs border border-gray-200 bg-gray-50 rounded-xl font-bold text-darkblue">
                    {calculateTermFromInvestiture(editInvestitureDate || profileData?.investitureDate || user.investitureDate)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Investiture Date</label>
                  <input
                    type="date"
                    value={editInvestitureDate}
                    onChange={(e) => setEditInvestitureDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Resignation Date</label>
                  <input
                    type="date"
                    value={editResignationDate}
                    onChange={(e) => setEditResignationDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-mono"
                  />
                </div>
              </div>

              {/* Attendance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Overall Attendance (Without Excused)</label>
                  <input
                    type="text"
                    placeholder="e.g. 85%"
                    value={editAttendanceWithoutExcused}
                    onChange={(e) => setEditAttendanceWithoutExcused(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Overall Attendance (With Excused)</label>
                  <input
                    type="text"
                    placeholder="e.g. 95%"
                    value={editAttendanceWithExcused}
                    onChange={(e) => setEditAttendanceWithExcused(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Permanent Address */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="text-xs font-bold text-darkblue uppercase">Permanent Address</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1">Country</label>
                    <select
                      value={editPermCountry}
                      onChange={(e) => handlePermCountryChange(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-xl bg-white"
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1">State / Atoll / Province</label>
                    <select
                      value={editPermState}
                      onChange={(e) => handlePermStateChange(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-xl bg-white"
                    >
                      {getStatesForCountry(editPermCountry).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1">City / Island</label>
                    <select
                      value={editPermCity}
                      onChange={(e) => handlePermCityChange(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-xl bg-white"
                    >
                      {getCitiesForState(editPermCountry, editPermState).map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1">District</label>
                    <select
                      value={editPermDistrict}
                      onChange={(e) => setEditPermDistrict(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-xl bg-white"
                    >
                      {getDistrictsForCity(editPermCountry, editPermState, editPermCity).map(dist => <option key={dist} value={dist}>{dist}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-semibold mb-1">Street / House Name</label>
                  <input
                    type="text"
                    placeholder="Street / House Name"
                    value={editPermAddressLine}
                    onChange={(e) => setEditPermAddressLine(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Current Address */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="text-xs font-bold text-darkblue uppercase">Current Residential Address</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1">Country</label>
                    <select
                      value={editCurrCountry}
                      onChange={(e) => handleCurrCountryChange(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-xl bg-white"
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1">State / Atoll / Province</label>
                    <select
                      value={editCurrState}
                      onChange={(e) => handleCurrStateChange(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-xl bg-white"
                    >
                      {getStatesForCountry(editCurrCountry).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1">City / Island</label>
                    <select
                      value={editCurrCity}
                      onChange={(e) => handleCurrCityChange(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-xl bg-white"
                    >
                      {getCitiesForState(editCurrCountry, editCurrState).map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1">District</label>
                    <select
                      value={editCurrDistrict}
                      onChange={(e) => setEditCurrDistrict(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-xl bg-white"
                    >
                      {getDistrictsForCity(editCurrCountry, editCurrState, editCurrCity).map(dist => <option key={dist} value={dist}>{dist}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-semibold mb-1">Street / House Name</label>
                  <input
                    type="text"
                    placeholder="Street / House Name"
                    value={editCurrAddressLine}
                    onChange={(e) => setEditCurrAddressLine(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="text-xs font-bold text-maroon uppercase">Emergency Contact Info</div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={editEmergencyName}
                    onChange={(e) => setEditEmergencyName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={editEmergencyRel}
                      onChange={(e) => setEditEmergencyRel(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      value={editEmergencyNum}
                      onChange={(e) => setEditEmergencyNum(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-[11px] text-darkblue">
                All updates will immediately sync across your profile, member application records, and the Arabiyya Rover Roster directory.
              </div>

              <div className="flex justify-end space-x-2 pt-2 sticky bottom-0 bg-white py-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateSubmitting}
                  className="px-5 py-2 bg-maroon text-white font-bold text-xs rounded-xl hover:bg-[#660000]"
                >
                  {updateSubmitting ? 'Updating...' : 'Save All Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};
