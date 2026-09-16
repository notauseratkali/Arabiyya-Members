import React, { useState, useEffect } from 'react';
import { ProgressionLevel, RoleSection } from '../types';
import { CelebrationModal } from '../components/CelebrationModal';
import { LogoImage } from '../components/LogoImage';
import { useLogo } from '../context/LogoContext';
import { 
  COUNTRIES, 
  getStatesForCountry, 
  getCitiesForState, 
  getDistrictsForCity 
} from '../data/locationData';
import { 
  UserCheck, 
  Award, 
  Compass, 
  Clock,
  ShieldAlert, 
  FileCheck, 
  History, 
  User, 
  PhoneCall, 
  KeyRound, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface JoinPageProps {
  onNavigate: (path: string) => void;
}

const ATOLL_OPTIONS = [
  "Male'",
  "Haa Alif",
  "Haa Dhaalu",
  "Shaviyani",
  "Noonu",
  "Raa",
  "Baa",
  "Lhaviyani",
  "Kaafu",
  "Alif Alif",
  "Alif Dhaal",
  "Vaavu",
  "Meemu",
  "Faafu",
  "Dhaal",
  "Thaa",
  "Laamu",
  "Gaafu Alif",
  "Gaafu Dhaalu",
  "Gnaviyani",
  "Seenu / Addu"
];

const COUNTRY_PHONE_CODES = [
  { code: '+960', country: 'Maldives 🇲🇻 (+960)' },
  { code: '+970', country: 'Palestine 🇵🇸 (+970)' },
  { code: '+971', country: 'UAE 🇦🇪 (+971)' },
  { code: '+966', country: 'Saudi Arabia 🇸🇦 (+966)' },
  { code: '+974', country: 'Qatar 🇶🇦 (+974)' },
  { code: '+965', country: 'Kuwait 🇰🇼 (+965)' },
  { code: '+968', country: 'Oman 🇴🇲 (+968)' },
  { code: '+60', country: 'Malaysia 🇲🇾 (+60)' },
  { code: '+62', country: 'Indonesia 🇮🇩 (+62)' },
  { code: '+65', country: 'Singapore 🇸🇬 (+65)' },
  { code: '+91', country: 'India 🇮🇳 (+91)' },
  { code: '+94', country: 'Sri Lanka 🇱🇰 (+94)' },
  { code: '+92', country: 'Pakistan 🇵🇰 (+92)' },
  { code: '+880', country: 'Bangladesh 🇧🇩 (+880)' },
  { code: '+44', country: 'United Kingdom 🇬🇧 (+44)' },
  { code: '+1', country: 'USA / Canada 🇺🇸🇨🇦 (+1)' },
  { code: '+61', country: 'Australia 🇦🇺 (+61)' },
  { code: '+20', country: 'Egypt 🇪🇬 (+20)' },
  { code: '+962', country: 'Jordan 🇯🇴 (+962)' },
  { code: '+961', country: 'Lebanon 🇱🇧 (+961)' },
  { code: '+90', country: 'Turkey 🇹🇷 (+90)' },
  { code: '+86', country: 'China 🇨🇳 (+86)' },
  { code: '+81', country: 'Japan 🇯🇵 (+81)' },
  { code: '+82', country: 'South Korea 🇰🇷 (+82)' },
  { code: '+49', country: 'Germany 🇩🇪 (+49)' },
  { code: '+33', country: 'France 🇫🇷 (+33)' },
  { code: '+39', country: 'Italy 🇮🇹 (+39)' },
  { code: '+34', country: 'Spain 🇪🇸 (+34)' },
  { code: '+31', country: 'Netherlands 🇳🇱 (+31)' },
  { code: '+41', country: 'Switzerland 🇨🇭 (+41)' },
  { code: '+27', country: 'South Africa 🇿🇦 (+27)' },
  { code: '+64', country: 'New Zealand 🇳🇿 (+64)' },
];

export const JoinPage: React.FC<JoinPageProps> = ({ onNavigate }) => {
  const { refreshLogo } = useLogo();

  useEffect(() => {
    refreshLogo();
  }, [refreshLogo]);

  // Page Step State: 1 to 8, or 'leader_track', or 'submitted_success', or 'leader_submitted_success'
  const [currentPage, setCurrentPage] = useState<number | 'leader_track' | 'submitted_success' | 'leader_submitted_success'>(1);

  // Form Data State
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  const [ageCalculation, setAgeCalculation] = useState<{
    eligible: boolean;
    isLeaderCandidate?: boolean;
    role?: RoleSection;
    ageYears: number;
    ageMonths: number;
    ageDays: number;
    message?: string;
  } | null>(null);

  const [ageError, setAgeError] = useState<string | null>(null);

  // Page 2: Award Goal
  const [awardIntent, setAwardIntent] = useState<boolean | null>(null);

  // Page 3: Current Level
  const [currentLevel, setCurrentLevel] = useState<ProgressionLevel | ''>('');
  const [estimatedTimeline, setEstimatedTimeline] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState(false);

  // Page 4: Commitment
  const [commitmentAgreed, setCommitmentAgreed] = useState(false);

  // Page 5: Scouting Background
  const [isNewToScouting, setIsNewToScouting] = useState<boolean | null>(null);
  const [lastScoutGroup, setLastScoutGroup] = useState('');
  const [scoutGroupNumber, setScoutGroupNumber] = useState('');
  const [scoutGroupState, setScoutGroupState] = useState("Male'");

  const updateFullScoutGroup = (numRaw: string, stateVal: string) => {
    const trimmedNum = numRaw.trim();
    if (!trimmedNum) {
      setLastScoutGroup('');
      return;
    }
    let formattedNum = trimmedNum;
    if (/^\d+$/.test(trimmedNum)) {
      const n = parseInt(trimmedNum, 10);
      const j = n % 10;
      const k = n % 100;
      if (j === 1 && k !== 11) {
        formattedNum = `${n}st`;
      } else if (j === 2 && k !== 12) {
        formattedNum = `${n}nd`;
      } else if (j === 3 && k !== 13) {
        formattedNum = `${n}rd`;
      } else {
        formattedNum = `${n}th`;
      }
    }
    setLastScoutGroup(`${formattedNum} ${stateVal} Scout Group`);
  };

  const handleScoutGroupNumberChange = (val: string) => {
    setScoutGroupNumber(val);
    updateFullScoutGroup(val, scoutGroupState);
  };

  const handleScoutGroupStateChange = (val: string) => {
    setScoutGroupState(val);
    updateFullScoutGroup(scoutGroupNumber, val);
  };

  // Page 6: Personal Info
  const [fullName, setFullName] = useState('');
  const [commonName, setCommonName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [gender, setGender] = useState('Male');

  const [permCountry, setPermCountry] = useState('Maldives');
  const [permState, setPermState] = useState("Male' (Capital City)");
  const [permCity, setPermCity] = useState("Male'");
  const [permDistrict, setPermDistrict] = useState('Henveiru');
  const [permAddress, setPermAddress] = useState('');

  const [sameAddress, setSameAddress] = useState(true);
  const [currCountry, setCurrCountry] = useState('Maldives');
  const [currState, setCurrState] = useState("Male' (Capital City)");
  const [currCity, setCurrCity] = useState("Male'");
  const [currDistrict, setCurrDistrict] = useState('Henveiru');
  const [currAddress, setCurrAddress] = useState('');

  const handlePermCountryChange = (c: string) => {
    setPermCountry(c);
    const states = getStatesForCountry(c);
    const defaultState = states[0] || '';
    setPermState(defaultState);
    const cities = getCitiesForState(c, defaultState);
    const defaultCity = cities[0] || '';
    setPermCity(defaultCity);
    const districts = getDistrictsForCity(c, defaultState, defaultCity);
    setPermDistrict(districts[0] || 'N/A');
  };

  const handlePermStateChange = (s: string) => {
    setPermState(s);
    const cities = getCitiesForState(permCountry, s);
    const defaultCity = cities[0] || '';
    setPermCity(defaultCity);
    const districts = getDistrictsForCity(permCountry, s, defaultCity);
    setPermDistrict(districts[0] || 'N/A');
  };

  const handlePermCityChange = (city: string) => {
    setPermCity(city);
    const districts = getDistrictsForCity(permCountry, permState, city);
    setPermDistrict(districts[0] || 'N/A');
  };

  const handleCurrCountryChange = (c: string) => {
    setCurrCountry(c);
    const states = getStatesForCountry(c);
    const defaultState = states[0] || '';
    setCurrState(defaultState);
    const cities = getCitiesForState(c, defaultState);
    const defaultCity = cities[0] || '';
    setCurrCity(defaultCity);
    const districts = getDistrictsForCity(c, defaultState, defaultCity);
    setCurrDistrict(districts[0] || 'N/A');
  };

  const handleCurrStateChange = (s: string) => {
    setCurrState(s);
    const cities = getCitiesForState(currCountry, s);
    const defaultCity = cities[0] || '';
    setCurrCity(defaultCity);
    const districts = getDistrictsForCity(currCountry, s, defaultCity);
    setCurrDistrict(districts[0] || 'N/A');
  };

  const handleCurrCityChange = (city: string) => {
    setCurrCity(city);
    const districts = getDistrictsForCity(currCountry, currState, city);
    setCurrDistrict(districts[0] || 'N/A');
  };

  // Page 7: Contact Info
  const [phoneCode, setPhoneCode] = useState('+960');
  const [phoneNum, setPhoneNum] = useState('');
  const [mobileCode, setMobileCode] = useState('+960');
  const [mobileNum, setMobileNum] = useState('');
  const [telegramTag, setTelegramTag] = useState('');
  const [instagramTag, setInstagramTag] = useState('');
  const [email, setEmail] = useState('');
  const [emailLocked, setEmailLocked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      fetch(`/api/verify-invite/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.email) {
            setEmail(data.email);
            setEmailLocked(true);
          }
        })
        .catch(console.error);
    }
  }, []);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Parent');
  const [emergencyCode, setEmergencyCode] = useState('+960');
  const [emergencyNum, setEmergencyNum] = useState('');

  // Page 8: Login Details
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [policyAgreed, setPolicyAgreed] = useState(false);

  // Leader Track Fields
  const [leaderFullName, setLeaderFullName] = useState('');
  const [leaderIdCard, setLeaderIdCard] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [leaderMobile, setLeaderMobile] = useState('');
  const [leaderAddress, setLeaderAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const checkFieldAvailability = async (fields: Record<string, string>) => {
    try {
      const res = await fetch('/api/signup/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      
      // Merge new errors with existing ones, or clear specific ones if they are now valid
      setFieldErrors(prev => {
        const next = { ...prev };
        // Clear fields we just checked that are NOT in data.errors
        Object.keys(fields).forEach(key => {
          if (!data.errors || !data.errors[key]) {
            delete next[key];
          }
        });
        // Add new errors
        if (data.errors) {
          Object.assign(next, data.errors);
        }
        return next;
      });

      return !data.errors || Object.keys(data.errors).length === 0;
    } catch (err) {
      return false;
    }
  };

  // Live validation debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      const fieldsToCheck: Record<string, string> = {};
      
      if (currentPage === 'leader_track') {
        if (leaderIdCard && leaderIdCard.length >= 3) fieldsToCheck.idCardNumber = leaderIdCard;
        if (leaderEmail && leaderEmail.includes('@')) fieldsToCheck.email = leaderEmail;
        if (leaderPhone && leaderPhone.length >= 7) fieldsToCheck.phoneNumber = `${phoneCode} ${leaderPhone}`;
        if (leaderMobile && leaderMobile.length >= 7) fieldsToCheck.mobileNumber = `${mobileCode} ${leaderMobile}`;
      } else {
        if (idCardNumber && idCardNumber.length >= 3) fieldsToCheck.idCardNumber = idCardNumber;
        if (email && email.includes('@')) fieldsToCheck.email = email;
        if (phoneNum && phoneNum.length >= 7) fieldsToCheck.phoneNumber = `${phoneCode} ${phoneNum}`;
        if (mobileNum && mobileNum.length >= 7) fieldsToCheck.mobileNumber = `${mobileCode} ${mobileNum}`;
        if (telegramTag && telegramTag.length >= 3) fieldsToCheck.telegramTag = telegramTag;
        if (instagramTag && instagramTag.length >= 3) fieldsToCheck.instagramTag = instagramTag;
        if (username && username.length >= 3) fieldsToCheck.username = username;
      }

      if (Object.keys(fieldsToCheck).length > 0) {
        checkFieldAvailability(fieldsToCheck);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [idCardNumber, email, phoneNum, mobileNum, telegramTag, instagramTag, username, phoneCode, mobileCode, leaderIdCard, leaderEmail, leaderPhone, leaderMobile, currentPage]);

  // Specific Error Message Helper
  const renderFieldError = (field: string) => {
    if (!fieldErrors[field]) return null;
    
    const isLoginRelated = ['idCardNumber', 'email', 'username'].includes(field);
    
    return (
      <div className="mt-1.5 flex flex-col space-y-1">
        <p className="text-[11px] font-bold text-red-600 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>{fieldErrors[field]}</span>
        </p>
        {isLoginRelated && (
          <button
            type="button"
            onClick={() => onNavigate('/signin')}
            className="text-[10px] font-bold text-maroon hover:underline flex items-center space-x-1 w-fit"
          >
            <span>Already have an account? Click here to Sign In</span>
          </button>
        )}
      </div>
    );
  };

  // Page 6 Continue Handler
  const handlePage6Continue = async () => {
    setIsValidating(true);
    const isAvailable = await checkFieldAvailability({ idCardNumber });
    setIsValidating(false);
    if (isAvailable) {
      setCurrentPage(7);
    }
  };

  // Page 7 Continue Handler
  const handlePage7Continue = async () => {
    setIsValidating(true);
    const isAvailable = await checkFieldAvailability({ 
      email, 
      mobileNumber: `${mobileCode} ${mobileNum}`,
      telegramTag,
      instagramTag
    });
    setIsValidating(false);
    if (isAvailable) {
      setCurrentPage(8);
    }
  };

  // Page 8 Continue Handler (Username check)
  const handlePage8Continue = async () => {
    setIsValidating(true);
    const isAvailable = await checkFieldAvailability({ username });
    setIsValidating(false);
    if (isAvailable) {
      // Final submission is handled by handleMemberSignUp
    }
  };
  useEffect(() => {
    const country = sameAddress ? permCountry : currCountry;
    if (country.toLowerCase().includes('maldives')) {
      setPhoneCode('+960');
      setMobileCode('+960');
    } else if (country.toLowerCase().includes('united states') || country.toLowerCase().includes('usa')) {
      setPhoneCode('+1');
      setMobileCode('+1');
    } else if (country.toLowerCase().includes('united kingdom') || country.toLowerCase().includes('uk')) {
      setPhoneCode('+44');
      setMobileCode('+44');
    } else if (country.toLowerCase().includes('india')) {
      setPhoneCode('+91');
      setMobileCode('+91');
    } else if (country.toLowerCase().includes('sri lanka')) {
      setPhoneCode('+94');
      setMobileCode('+94');
    }
  }, [permCountry, currCountry, sameAddress]);

  // Handle Page 1 Continue: Age Verification
  const handlePage1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgeError(null);

    if (!year || !month || !day) {
      setAgeError('Please fill in Year, Month, and Day.');
      return;
    }

    try {
      const res = await fetch('/api/signup/verify-dob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, day })
      });
      const data = await res.json();

      if (!res.ok) {
        setAgeError(data.error || 'Validation failed.');
        return;
      }

      setAgeCalculation(data);

      if (!data.eligible) {
        setAgeError(data.message || 'We currently accept members aged 16 and above.');
        return;
      }

      if (data.isLeaderCandidate) {
        setCurrentPage('leader_track');
      } else {
        setCurrentPage(2);
      }
    } catch (err: any) {
      setAgeError('Network error verifying age.');
    }
  };

  // Handle Level Selection in Page 3
  const handleLevelSelect = (level: ProgressionLevel, timelineMsg: string) => {
    setCurrentLevel(level);
    setEstimatedTimeline(timelineMsg);

    if (level === 'President Scout Award' || level === 'President Scout Award Holder') {
      setShowCelebration(true);
    }
  };

  // Submit Member Form (Page 8)
  const handleMemberSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (!policyAgreed) {
      setFormError('You must agree to the Rover Operating Policy to complete sign up.');
      return;
    }

    setSubmitting(true);

    const awardGoalText = ageCalculation?.role === 'Explorer' 
      ? 'President Scout Award' 
      : 'Baden-Powell Award';

    const payload = {
      dob: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
      ageYears: ageCalculation?.ageYears || 0,
      ageMonths: ageCalculation?.ageMonths || 0,
      ageDays: ageCalculation?.ageDays || 0,
      role: ageCalculation?.role || 'Rover',
      awardIntent: !!awardIntent,
      awardGoal: awardIntent ? awardGoalText : 'None',
      currentLevel,
      estimatedTimeline: awardIntent ? `${calculateRemainingAwardTime()} remaining` : 'N/A',
      isNewToScouting: !!isNewToScouting,
      lastScoutGroup: !isNewToScouting ? lastScoutGroup : undefined,
      fullName,
      commonName,
      idCardNumber,
      gender,
      permanentAddress: {
        country: permCountry,
        state: permState,
        city: permCity,
        district: permDistrict,
        addressLine: permAddress
      },
      currentAddress: sameAddress ? {
        country: permCountry,
        state: permState,
        city: permCity,
        district: permDistrict,
        addressLine: permAddress
      } : {
        country: currCountry,
        state: currState,
        city: currCity,
        district: currDistrict,
        addressLine: currAddress
      },
      phoneNumber: `${mobileCode} ${mobileNum}`,
      mobileNumber: `${mobileCode} ${mobileNum}`,
      telegramTag,
      instagramTag,
      email,
      emergencyName,
      emergencyRelationship,
      emergencyNumber: `${emergencyCode} ${emergencyNum}`,
      username,
      passwordHash: password,
      policyAgreed
    };

    try {
      const res = await fetch('/api/signup/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setFormError(resData.error || 'Failed to submit application.');
        return;
      }

      setCurrentPage('submitted_success');
    } catch (err) {
      setSubmitting(false);
      setFormError('Error connecting to server. Please try again.');
    }
  };

  // Handle Leader Application Submission
  const handleLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!leaderFullName || !leaderIdCard || !leaderEmail) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);

    const payload = {
      fullName: leaderFullName,
      idCardNumber: leaderIdCard,
      permanentAddress: {
        country: permCountry,
        state: permState,
        city: permCity,
        district: permDistrict,
        addressLine: permAddress
      },
      currentAddress: sameAddress ? {
        country: permCountry,
        state: permState,
        city: permCity,
        district: permDistrict,
        addressLine: permAddress
      } : {
        country: currCountry,
        state: currState,
        city: currCity,
        district: currDistrict,
        addressLine: currAddress
      },
      phoneNumber: `${mobileCode} ${leaderMobile}`,
      mobileNumber: `${mobileCode} ${leaderMobile}`,
      email: leaderEmail
    };

    try {
      const res = await fetch('/api/signup/leader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setFormError(data.error || 'Submission failed.');
        return;
      }

      setCurrentPage('leader_submitted_success');
    } catch (err) {
      setSubmitting(false);
      setFormError('Server connection error.');
    }
  };

  // Helper to calculate exact remaining time until 18th (Explorer) or 26th (Rover) birthday
  const calculateRemainingAwardTime = () => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    if (isNaN(y) || isNaN(m) || isNaN(d)) {
      return ageCalculation?.role === 'Explorer' ? '~15 months' : '~3 years';
    }

    const targetAge = (ageCalculation?.role || 'Rover') === 'Explorer' ? 18 : 26;
    const today = new Date();
    // Target deadline is 1 day before target birthday
    const targetDate = new Date(y + targetAge, m - 1, d - 1);

    if (targetDate <= today) {
      return '0 days';
    }

    let years = targetDate.getFullYear() - today.getFullYear();
    let months = targetDate.getMonth() - today.getMonth();
    let days = targetDate.getDate() - today.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);

    if (parts.length === 0) return 'less than 1 day';
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
  };

  // Timeline lookup for Explorer / Rover levels
  const getTimelineOption = (level: ProgressionLevel) => {
    if (!awardIntent) return '';
    if (ageCalculation?.role === 'Explorer') {
      switch (level) {
        case 'Square': return '~15 months to President Scout Award';
        case 'Scout Standard': return '~12 months to President Scout Award';
        case 'Advanced Scout Standard': return '~9 months to President Scout Award';
        case 'Bushman\'s Thong': return '~6 months to President Scout Award';
        case 'President Scout Award': return 'President Scout Award Holder';
        default: return '';
      }
    } else {
      switch (level) {
        case 'Square': return '~3 years to Baden-Powell Award';
        case 'Scout Standard': return '~2 years and 6 months to Baden-Powell Award';
        case 'Advanced Scout Standard': return '~2 years to Baden-Powell Award';
        case 'Bushman\'s Thong': return '~2 years to Baden-Powell Award';
        case 'President Scout Award Holder': return '~2 years to Baden-Powell Award';
        default: return '';
      }
    }
  };

  const currentRole = ageCalculation?.role || 'Rover';
  const awardTargetName = currentRole === 'Explorer' ? 'President Scout Award' : 'Baden-Powell Award';

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl w-full mx-auto">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-sky-100 flex items-center justify-center p-1 mx-auto mb-3 shadow-xs">
            <LogoImage className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-darkblue">Arabiyya Members</h1>
          <p className="text-xs font-bold text-maroon uppercase tracking-wider mt-0.5">
            Arabiyya Rover Network
          </p>
        </div>

        {/* Celebration Modal Triggered on Page 3 */}
        <CelebrationModal
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          awardName={currentRole === 'Explorer' ? 'President Scout Award' : 'President Scout Award Holder'}
        />

        {/* PAGE 1: Date of Birth & Age Verification */}
        {currentPage === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-blue-50 text-darkblue rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-darkblue">Age Verification & Eligibility</h2>
                <p className="text-xs text-gray-500">
                  Please enter your date of birth to determine your membership section.
                </p>
              </div>
            </div>

            <form onSubmit={handlePage1Submit} className="space-y-6">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Year (YYYY)
                  </label>
                  <input
                    type="number"
                    placeholder="2005"
                    min="1940"
                    max="2026"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon focus:border-maroon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Month (MM)
                  </label>
                  <input
                    type="number"
                    placeholder="05"
                    min="1"
                    max="12"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon focus:border-maroon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Day (DD)
                  </label>
                  <input
                    type="number"
                    placeholder="15"
                    min="1"
                    max="31"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon focus:border-maroon"
                  />
                </div>
              </div>

              {ageError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 text-sm">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Eligibility Notice:</span>
                    <span>{ageError}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-maroon hover:bg-[#660000] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* PAGE 2: Award Intent */}
        {currentPage === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-darkblue">Award Goal</h2>
                <p className="text-xs text-gray-500">
                  Section: <span className="font-bold text-maroon">{currentRole}</span>
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-xl">
                <p className="text-base font-bold text-darkblue text-center">
                  {currentRole === 'Explorer'
                    ? 'Are you willing to work toward the President Scout Award?'
                    : 'Are you willing to work toward the Baden-Powell Award?'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setAwardIntent(true);
                    setCurrentPage(3);
                  }}
                  className={`p-5 rounded-xl border-2 font-bold text-center transition-all flex flex-col items-center justify-center space-y-2 ${
                    awardIntent === true
                      ? 'border-maroon bg-maroon text-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-maroon text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Sparkles className="w-6 h-6" />
                  <span>Yes, I am willing!</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAwardIntent(false);
                    setCurrentPage(3);
                  }}
                  className={`p-5 rounded-xl border-2 font-bold text-center transition-all flex flex-col items-center justify-center space-y-2 ${
                    awardIntent === false
                      ? 'border-darkblue bg-darkblue text-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-darkblue text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Info className="w-6 h-6" />
                  <span>No, just exploring</span>
                </button>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setCurrentPage(1)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 3: Current Level & Progression Timeline */}
        {currentPage === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-indigo-50 text-indigo-800 rounded-xl">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-darkblue">Current Standing</h2>
                <p className="text-xs text-gray-500">
                  Select your current scouting progression level.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-800">
                What is your current level in the progression?
              </label>

              <div className="space-y-2.5">
                {(currentRole === 'Explorer' 
                  ? ['Square', 'Scout Standard', 'Advanced Scout Standard', 'Bushman\'s Thong', 'President Scout Award']
                  : ['Square', 'Scout Standard', 'Advanced Scout Standard', 'Bushman\'s Thong', 'President Scout Award Holder']
                ).map((level) => {
                  const timelineMsg = getTimelineOption(level as ProgressionLevel);
                  const isSelected = currentLevel === level;

                  return (
                    <div
                      key={level}
                      onClick={() => handleLevelSelect(level as ProgressionLevel, timelineMsg)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-maroon bg-red-50/50 ring-2 ring-maroon'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-maroon bg-maroon text-white' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="font-bold text-sm text-gray-900">{level}</span>
                      </div>

                      {/* Conditional Timeline Message: Displayed ONLY if applicant selected Yes on Page 2 */}
                      {awardIntent && timelineMsg && (
                        <div className="flex flex-col sm:items-end gap-0.5">
                          <div className="text-[10px] text-gray-500 font-medium">
                            Standard Requirement: {timelineMsg}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Benchmark Summary Box */}
              {awardIntent && currentLevel && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 text-xs animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-amber-200/60">
                    <span className="text-gray-700 font-bold flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-maroon" />
                      <span>Time Remaining to Award Deadline:</span>
                    </span>
                    <strong className="text-maroon font-black text-sm">
                      {calculateRemainingAwardTime()} remaining
                    </strong>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-gray-600">
                    <span>Standard Requirement from {currentLevel}:</span>
                    <strong className="text-darkblue font-semibold">{estimatedTimeline || 'N/A'}</strong>
                  </div>
                  <div className="text-[11px] text-amber-900 bg-white/70 p-2 rounded-lg border border-amber-100">
                    <strong>Submission Rule:</strong> Your final submission for {awardTargetName} must be completed no later than 1 day before your {currentRole === 'Explorer' ? '18th' : '26th'} birthday.
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentPage(2)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={!currentLevel}
                  onClick={() => setCurrentPage(4)}
                  className="px-6 py-2.5 bg-maroon hover:bg-[#660000] disabled:bg-gray-300 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 4: Information Review & Commitment Check */}
        {currentPage === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-darkblue">Review and Confirmation</h2>
                <p className="text-xs text-gray-500">
                  Read and verify your generated commitment statement.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm leading-relaxed font-medium">
                {awardIntent ? (
                  <>
                    "I am currently <strong className="text-darkblue">{ageCalculation?.ageYears}</strong> years, <strong className="text-darkblue">{ageCalculation?.ageMonths}</strong> months, and <strong className="text-darkblue">{ageCalculation?.ageDays}</strong> days old, and I would like to work toward the <strong className="text-maroon">{awardTargetName}</strong>. This award estimatedly requires <strong className="text-amber-800">{estimatedTimeline || 'specified time'}</strong> to complete from my current standing, and I actually have <strong className="text-maroon font-bold">{calculateRemainingAwardTime()}</strong> remaining until my birthday submission deadline. I understand that earning this award requires dedicated commitment and that the last day I can submit for {awardTargetName} is one day before my {currentRole === 'Explorer' ? '18th' : '26th'} birthday, and I am fully willing to make that commitment."
                  </>
                ) : (
                  <>
                    "I am currently <strong className="text-darkblue">{ageCalculation?.ageYears}</strong> years, <strong className="text-darkblue">{ageCalculation?.ageMonths}</strong> months, and <strong className="text-darkblue">{ageCalculation?.ageDays}</strong> days old, and I do not want to work toward an award just yet. I am here to explore scouting, and depending on my experience, I will consider pursuing an award in the future."
                  </>
                )}
              </div>

              <label className="flex items-start space-x-3 cursor-pointer p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <input
                  type="checkbox"
                  checked={commitmentAgreed}
                  onChange={(e) => setCommitmentAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 text-maroon rounded-md border-gray-300 focus:ring-maroon"
                />
                <span className="text-sm font-bold text-darkblue">
                  I acknowledge and agree to this commitment
                </span>
              </label>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentPage(3)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={!commitmentAgreed}
                  onClick={() => setCurrentPage(5)}
                  className="px-6 py-2.5 bg-maroon hover:bg-[#660000] disabled:bg-gray-300 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 5: Scouting Background */}
        {currentPage === 5 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-purple-50 text-purple-800 rounded-xl">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-darkblue">Scouting History</h2>
                <p className="text-xs text-gray-500">
                  Tell us about your previous scouting experience.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-base font-bold text-darkblue">
                Are you New to Scouting?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewToScouting(true);
                    setLastScoutGroup('');
                    setScoutGroupNumber('');
                  }}
                  className={`p-4 rounded-xl border-2 font-bold transition-all text-center ${
                    isNewToScouting === true
                      ? 'border-maroon bg-maroon text-white shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 text-gray-800 bg-white'
                  }`}
                >
                  I am new
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsNewToScouting(false);
                  }}
                  className={`p-4 rounded-xl border-2 font-bold transition-all text-center ${
                    isNewToScouting === false
                      ? 'border-darkblue bg-darkblue text-white shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 text-gray-800 bg-white'
                  }`}
                >
                  Previously or currently a Scout / rover
                </button>
              </div>

              {isNewToScouting === false && (
                <div className="p-5 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-sm font-bold text-darkblue mb-1">
                      Select the last Scout Group you were in.
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Group Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 11 or 11th"
                        value={scoutGroupNumber}
                        onChange={(e) => handleScoutGroupNumberChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        State / Atoll
                      </label>
                      <select
                        value={scoutGroupState}
                        onChange={(e) => handleScoutGroupStateChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon bg-white font-medium"
                      >
                        {ATOLL_OPTIONS.map((atoll) => (
                          <option key={atoll} value={atoll}>
                            {atoll}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {lastScoutGroup && (
                    <div className="p-3 bg-white border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Selected Scout Group:</span>
                      <strong className="font-bold text-darkblue text-sm">{lastScoutGroup}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentPage(4)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isNewToScouting === null || (isNewToScouting === false && !lastScoutGroup.trim())}
                  onClick={() => setCurrentPage(6)}
                  className="px-6 py-2.5 bg-maroon hover:bg-[#660000] disabled:bg-gray-300 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 6: Personal Information */}
        {currentPage === 6 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-teal-50 text-teal-800 rounded-xl">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-darkblue">Personal Information</h2>
                <p className="text-xs text-gray-500">
                  Please provide your official identification and addresses.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Full Registered Name"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Common Name *
                  </label>
                  <input
                    type="text"
                    value={commonName}
                    onChange={(e) => setCommonName(e.target.value)}
                    required
                    placeholder="Preferred Display Name"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    ID Card Number *
                  </label>
                  <input
                    type="text"
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value)}
                    required
                    placeholder="e.g. A123456"
                    className={`w-full px-3.5 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-maroon uppercase ${fieldErrors.idCardNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {renderFieldError('idCardNumber')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Permanent Address */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-maroon uppercase tracking-wider mb-2">
                  Permanent Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Country *</label>
                    <select
                      value={permCountry}
                      onChange={(e) => handlePermCountryChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-maroon"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">State / Governorate / Atoll *</label>
                    <select
                      value={permState}
                      onChange={(e) => handlePermStateChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-maroon truncate"
                    >
                      {getStatesForCountry(permCountry).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">City / Island *</label>
                    <select
                      value={permCity}
                      onChange={(e) => handlePermCityChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-maroon truncate"
                    >
                      {getCitiesForState(permCountry, permState).map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">District *</label>
                    <select
                      value={permDistrict}
                      onChange={(e) => setPermDistrict(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-maroon truncate"
                    >
                      {getDistrictsForCity(permCountry, permState, permCity).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Address Line (e.g. H. Moonlight Villa or Building No.)"
                  value={permAddress}
                  onChange={(e) => setPermAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon"
                />
              </div>

              {/* Current Address */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                  <h3 className="text-xs font-bold text-darkblue uppercase tracking-wider">
                    Current Address
                  </h3>
                  <label className="flex items-center space-x-2 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAddress}
                      onChange={(e) => setSameAddress(e.target.checked)}
                      className="rounded-md text-maroon border-gray-300 focus:ring-maroon"
                    />
                    <span>Same as permanent address</span>
                  </label>
                </div>

                {!sameAddress && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Country *</label>
                        <select
                          value={currCountry}
                          onChange={(e) => handleCurrCountryChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-maroon"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">State / Governorate / Atoll *</label>
                        <select
                          value={currState}
                          onChange={(e) => handleCurrStateChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-maroon truncate"
                        >
                          {getStatesForCountry(currCountry).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">City / Island *</label>
                        <select
                          value={currCity}
                          onChange={(e) => handleCurrCityChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-maroon truncate"
                        >
                          {getCitiesForState(currCountry, currState).map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">District *</label>
                        <select
                          value={currDistrict}
                          onChange={(e) => setCurrDistrict(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-maroon truncate"
                        >
                          {getDistrictsForCity(currCountry, currState, currCity).map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Current Address Line"
                      value={currAddress}
                      onChange={(e) => setCurrAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentPage(5)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={!fullName || !commonName || !idCardNumber || isValidating}
                  onClick={handlePage6Continue}
                  className="px-6 py-2.5 bg-maroon hover:bg-[#660000] disabled:bg-gray-300 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
                >
                  {isValidating && currentPage === 6 ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page 6 Errors */}
              {currentPage === 6 && fieldErrors.idCardNumber && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-xs font-medium">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{fieldErrors.idCardNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('/signin')}
                    className="px-3 py-1 bg-white border border-red-200 rounded-lg text-maroon font-bold hover:bg-red-50 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              )}

        {/* PAGE 7: Contact & Emergency Details */}
        {currentPage === 7 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-sky-50 text-sky-800 rounded-xl">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-darkblue">Contact & Emergency Information</h2>
                <p className="text-xs text-gray-500">
                  Provide channels for crew communications and emergency alerts.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Mobile Number *
                </label>
                <div className="flex space-x-2">
                  <select
                    value={mobileCode}
                    onChange={(e) => setMobileCode(e.target.value)}
                    className="w-28 sm:w-36 shrink-0 px-2 py-2 text-xs border border-gray-300 rounded-xl bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-maroon truncate"
                  >
                    {COUNTRY_PHONE_CODES.map((item) => (
                      <option key={`m-${item.code}-${item.country}`} value={item.code} label={item.country}>
                        {item.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="7890123"
                    value={mobileNum}
                    onChange={(e) => setMobileNum(e.target.value)}
                    required
                    className={`flex-1 min-w-0 px-3.5 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-maroon ${fieldErrors.mobileNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                </div>
                {renderFieldError('mobileNumber')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Telegram Tag / Number
                  </label>
                  <input
                    type="text"
                    placeholder="username"
                    value={telegramTag}
                    onChange={(e) => setTelegramTag(e.target.value.replace(/@/g, ''))}
                    className={`w-full px-3.5 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-maroon ${fieldErrors.telegramTag ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {renderFieldError('telegramTag')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Instagram Tag
                  </label>
                  <input
                    type="text"
                    placeholder="instagram_handle"
                    value={instagramTag}
                    onChange={(e) => setInstagramTag(e.target.value.replace(/@/g, ''))}
                    className={`w-full px-3.5 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-maroon ${fieldErrors.instagramTag ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {renderFieldError('instagramTag')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => { if (!emailLocked) setEmail(e.target.value) }}
                  required
                  readOnly={emailLocked}
                  className={`w-full px-3.5 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-maroon ${emailLocked ? 'bg-gray-100 text-gray-500' : ''} ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {renderFieldError('email')}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold text-maroon uppercase tracking-wider mb-3">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Emergency Contact Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Next of Kin / Guardian"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Relationship *
                    </label>
                    <select
                      value={emergencyRelationship}
                      onChange={(e) => setEmergencyRelationship(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-maroon"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Relative">Relative</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Emergency Contact Number *
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={emergencyCode}
                        onChange={(e) => setEmergencyCode(e.target.value)}
                        className="w-28 sm:w-36 shrink-0 px-2 py-2 text-xs border border-gray-300 rounded-xl bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-maroon truncate"
                      >
                        {COUNTRY_PHONE_CODES.map((item) => (
                          <option key={`e-${item.code}-${item.country}`} value={item.code} label={item.country}>
                            {item.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={emergencyNum}
                        onChange={(e) => setEmergencyNum(e.target.value)}
                        required
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentPage(6)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={!mobileNum || !email || !emergencyName || !emergencyRelationship || !emergencyNum || isValidating}
                  onClick={handlePage7Continue}
                  className="px-6 py-2.5 bg-maroon hover:bg-[#660000] disabled:bg-gray-300 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
                >
                  {isValidating && currentPage === 7 ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {currentPage === 7 && Object.keys(fieldErrors).length > 0 && (
                <div className="mt-4 space-y-2">
                  {Object.entries(fieldErrors).map(([field, err], idx) => {
                    const isLoginRelated = ['email'].includes(field);
                    return (
                      <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-xs font-medium">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>{err}</span>
                        </div>
                        {isLoginRelated && (
                          <button
                            type="button"
                            onClick={() => onNavigate('/signin')}
                            className="px-3 py-1 bg-white border border-red-200 rounded-lg text-maroon font-bold hover:bg-red-50 transition-colors"
                          >
                            Sign In
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGE 8: Login Details & Policy Agreement */}
        {currentPage === 8 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-darkblue">Account Credentials</h2>
                <p className="text-xs text-gray-500">
                  Set your login username and password to secure your account.
                </p>
              </div>
            </div>

            <form onSubmit={handleMemberSignUp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  placeholder="Choose unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  required
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-maroon ${fieldErrors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                <p className="mt-1 text-[11px] text-gray-500">Only letters and numbers are allowed. No spaces or symbols.</p>
                {renderFieldError('username')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon"
                  />
                </div>
              </div>

              <label className="flex items-start space-x-3 cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  checked={policyAgreed}
                  onChange={(e) => setPolicyAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 text-maroon rounded-md border-gray-300 focus:ring-maroon"
                />
                <span className="text-xs font-bold text-gray-800 leading-normal">
                  By Clicking Sign Up, I acknowledge and agree to abide by the Rover Operating Policy, if Invested.
                </span>
              </label>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                  {formError}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentPage(7)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting || !username || !password || !policyAgreed}
                  className="px-8 py-3 bg-maroon hover:bg-[#660000] disabled:bg-gray-300 text-white font-bold rounded-xl shadow-md transition-colors flex items-center space-x-2"
                >
                  {submitting ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Sign Up</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LEADER CANDIDATE REGISTRATION TRACK (Age >= 26) */}
        {currentPage === 'leader_track' && (
          <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-amber-100">
              <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-darkblue">Leader Candidate Registration</h2>
                <p className="text-xs text-amber-800 font-medium">
                  Direct track for adult leader advisors aged 26 and above.
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-6 bg-amber-50 p-4 rounded-xl border border-amber-200">
              Welcome! Please provide your official contact details below. Once submitted, your joining request will be forwarded to our administrative team.
            </p>

            <form onSubmit={handleLeaderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={leaderFullName}
                  onChange={(e) => setLeaderFullName(e.target.value)}
                  required
                  placeholder="Full Registered Name"
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  ID Card Number *
                </label>
                <input
                  type="text"
                  value={leaderIdCard}
                  onChange={(e) => setLeaderIdCard(e.target.value)}
                  required
                  placeholder="A123456"
                  className={`w-full px-3.5 py-2 text-sm border rounded-xl uppercase ${fieldErrors.idCardNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {renderFieldError('idCardNumber')}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Mobile Number *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={mobileCode}
                      onChange={(e) => setMobileCode(e.target.value)}
                      className="w-28 sm:w-32 shrink-0 px-2 py-2 text-xs border border-gray-300 rounded-xl bg-white font-semibold text-gray-800 truncate"
                    >
                      {COUNTRY_PHONE_CODES.map((item) => (
                        <option key={`lm-${item.code}-${item.country}`} value={item.code} label={item.country}>
                          {item.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="7890123"
                      value={leaderMobile}
                      onChange={(e) => setLeaderMobile(e.target.value)}
                      required
                      className={`flex-1 min-w-0 px-3.5 py-2 text-sm border rounded-xl ${fieldErrors.mobileNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                  </div>
                  {renderFieldError('mobileNumber')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="leader@example.com"
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  required
                  className={`w-full px-3.5 py-2 text-sm border rounded-xl ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {renderFieldError('email')}
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl">
                  {formError}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-darkblue hover:bg-blue-900 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Leader Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bottom Step Progress Indicator & Navigation Links */}
        {typeof currentPage === 'number' && (
          <div className="mt-6 bg-white rounded-2xl shadow-xs border border-gray-200 p-5">
            <div className="flex justify-between items-center text-xs font-bold text-darkblue mb-2">
              <span>Step {currentPage} of 8</span>
              <span className="text-gray-600">
                {currentPage === 1 && 'Age Verification'}
                {currentPage === 2 && 'Award Goal'}
                {currentPage === 3 && 'Current Standing'}
                {currentPage === 4 && 'Confirmation'}
                {currentPage === 5 && 'Scouting History'}
                {currentPage === 6 && 'Personal Info'}
                {currentPage === 7 && 'Contact Details'}
                {currentPage === 8 && 'Credentials'}
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-maroon h-full transition-all duration-300"
                style={{ width: `${(currentPage / 8) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom Sign In & Tracking Quick Links */}
        {(typeof currentPage === 'number' || currentPage === 'leader_track') && (
          <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-200 text-center shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-gray-600 font-medium">
              Already registered?
            </span>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => onNavigate('/track')}
                className="text-darkblue font-bold hover:underline"
              >
                Track Status
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={() => onNavigate('/signin')}
                className="px-3.5 py-1.5 bg-maroon text-white font-bold rounded-lg hover:bg-[#660000] transition-colors"
              >
                Sign In to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* POST-SIGNUP SUCCESS SCREEN (MEMBER) */}
        {currentPage === 'submitted_success' && (
          <div className="bg-white rounded-2xl shadow-md border border-emerald-200 p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-bold text-darkblue mb-3">Registration Successful!</h2>

            <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-950 font-bold text-base leading-relaxed mb-6">
              "Thank you for registering! Please wait for a call from the Arabiyya Rover Council regarding your membership in Arabiyya Members."
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onNavigate('/track')}
                className="px-6 py-3 bg-maroon hover:bg-[#660000] text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                Track Application Status
              </button>
              <button
                onClick={() => onNavigate('/signin')}
                className="px-6 py-3 bg-darkblue hover:bg-blue-900 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        )}

        {/* POST-SUBMISSION SUCCESS SCREEN (LEADER) */}
        {currentPage === 'leader_submitted_success' && (
          <div className="bg-white rounded-2xl shadow-md border border-amber-200 p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-300">
              <Award className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-bold text-darkblue mb-3">Leader Application Submitted</h2>

            <p className="text-sm text-gray-700 leading-relaxed mb-6 bg-amber-50 p-4 rounded-xl border border-amber-200">
              Thank you for applying for the Leader Registration Track. Your details have been stored securely in the administrative request queue (for a 30-day retention period) and instant alert emails have been dispatched to the Arabiyya Rover Council leadership team.
            </p>

            <button
              onClick={() => onNavigate('/signin')}
              className="px-6 py-3 bg-darkblue hover:bg-blue-900 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
