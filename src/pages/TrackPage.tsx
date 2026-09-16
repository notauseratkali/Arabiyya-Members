import React, { useState, useEffect } from 'react';
import { formatDateDDMMMYYYY } from '../utils/dateUtils';
import { ApplicationPipelineStatus } from '../types';
import { LogoImage } from '../components/LogoImage';
import { useLogo } from '../context/LogoContext';
import { Search, Mail, ShieldCheck, CheckCircle2, Clock, Calendar, ArrowRight, ArrowLeft, AlertCircle, Send } from 'lucide-react';

interface TrackPageProps {
  onNavigate: (path: string) => void;
}

export const TrackPage: React.FC<TrackPageProps> = ({ onNavigate }) => {
  const { refreshLogo } = useLogo();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [idCardNumber, setIdCardNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [emailObfuscated, setEmailObfuscated] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [botLink, setBotLink] = useState('https://t.me/asgmembersbot');
  const [botUsername, setBotUsername] = useState('@asgmembersbot');
  const [requireStart, setRequireStart] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  const [telegramTag, setTelegramTag] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dispatchedTo, setDispatchedTo] = useState('');
  const [checkingStart, setCheckingStart] = useState(false);
  const [checkStartResult, setCheckStartResult] = useState<{ started: boolean; message: string } | null>(null);

  useEffect(() => {
    refreshLogo();
  }, [refreshLogo]);

  useEffect(() => {
    if (!requireStart) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch('/api/telegram/check-start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramTag: telegramTag || dispatchedTo,
            mobileNumber: mobileNumber
          })
        });
        const data = await res.json();
        if (data.started) {
          setCheckStartResult({ started: true, message: data.message });
          setRequireStart(false); // Success! Auto-stops polling
        }
      } catch (err) {
        console.warn('Auto verification poll failed:', err);
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [requireStart, telegramTag, dispatchedTo, mobileNumber]);

  const [applicationData, setApplicationData] = useState<{
    id: string;
    fullName: string;
    role: string;
    status: ApplicationPipelineStatus;
    investitureDate?: string;
    createdAt: string;
    awardGoal: string;
    currentLevel: string;
  } | null>(null);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/track/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idCardNumber })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to send verification code.');
        return;
      }

      if (data.botLink) setBotLink(data.botLink);
      if (data.botUsername) setBotUsername(data.botUsername);
      if (data.requireStart) setRequireStart(true);
      if (data.otpCode) setSimulatedCode(data.otpCode);
      setTelegramTag(data.telegramTag || '');
      setMobileNumber(data.mobileNumber || '');
      setDispatchedTo(data.dispatchedTo || '');

      setEmailObfuscated(data.email);
      setStep(2);
    } catch (err) {
      setLoading(false);
      setErrorMsg('Server connection error.');
    }
  };

  const handleCheckStart = async () => {
    setCheckingStart(true);
    setCheckStartResult(null);
    try {
      const res = await fetch('/api/telegram/check-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramTag: telegramTag || dispatchedTo,
          mobileNumber: mobileNumber
        })
      });
      const data = await res.json();
      if (data.started) {
        setCheckStartResult({ started: true, message: data.message });
        setRequireStart(false); // Success! Hide warning
      } else {
        setCheckStartResult({ started: false, message: data.message });
      }
    } catch (err) {
      setCheckStartResult({ started: false, message: 'Failed to verify bot status. Please make sure you clicked /start first.' });
    } finally {
      setCheckingStart(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/track/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idCardNumber, otp })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid OTP code.');
        return;
      }

      setApplicationData(data.application);
      setStep(3);
    } catch (err) {
      setLoading(false);
      setErrorMsg('Server connection error.');
    }
  };

  const getStageNumber = (status: ApplicationPipelineStatus) => {
    switch (status) {
      case 'Pending Review':
      case 'Processing':
        return 1;
      case 'Interview & Investiture':
      case 'Interview':
        return 2;
      case 'Approved':
      case 'Investiture':
        return 3;
      case 'Rejected':
        return 0;
      default:
        return 1;
    }
  };

  const currentStageNum = applicationData ? getStageNumber(applicationData.status) : 1;

  const formatInvestitureDateDisplay = (dateStr?: string): string => {
    if (!dateStr || !dateStr.trim()) return '01 JAN 2026';
    return formatDateDDMMMYYYY(dateStr) || '01 JAN 2026';
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6 text-center">
          <div className="w-16 h-16 bg-white border border-sky-100 rounded-2xl flex items-center justify-center p-1 mx-auto mb-3 shadow-xs">
            <LogoImage className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-darkblue">Track Application Status</h1>
          <p className="text-xs text-gray-500 mt-1 font-semibold leading-relaxed">
            Enter your ID Card Number to securely view the live status of your application.
          </p>
        </div>

        {/* STEP 1: ID Card Input */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            {/* Telegram Bot Start Guidance Banner */}
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl mb-5 text-xs text-sky-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center space-x-1.5 text-sky-950 uppercase tracking-wider text-[11px]">
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  <span>Private Telegram Bot DM Delivery</span>
                </span>
                <span className="px-2 py-0.5 bg-sky-200 text-sky-900 font-bold text-[10px] rounded-full uppercase">
                  Private Only
                </span>
              </div>
              <p className="leading-relaxed text-sky-900">
                OTPs are sent strictly to your private Telegram DM.
              </p>
              <div className="pt-1">
                <a
                  href={botLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open {botUsername} on Telegram & click /start</span>
                </a>
              </div>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Step 1: Enter ID Card Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. A123456 or A345678"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon focus:border-maroon uppercase"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !idCardNumber}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Sending Private Telegram OTP...' : 'Send Private OTP via Telegram Bot'}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onNavigate('/policy')}
                className="text-gray-500 hover:text-darkblue"
              >
                Rover Policy
              </button>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/join')}
                  className="text-maroon hover:underline"
                >
                  New Applicant? Join
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={() => onNavigate('/signin')}
                  className="text-darkblue font-bold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl mb-6 text-xs text-sky-950 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <Send className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sky-950 font-bold mb-0.5">Private Telegram Bot OTP Dispatched</strong>
                    <p className="text-sky-900 leading-relaxed">
                      Verification codes are sent <strong>exclusively to your personal Telegram DM</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {requireStart && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 text-xs font-semibold space-y-1.5">
                  <p>⚠️ Haven't received the private message yet?</p>
                  <p className="font-normal">
                    Telegram requires you to click <strong>/start</strong> on our chatbot first before it can send you private DMs.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={botLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-md transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Click here to open {botUsername} & tap /start</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCheckStart}
                      disabled={checkingStart}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md transition-colors disabled:opacity-50"
                    >
                      {checkingStart ? 'Verifying...' : 'Verify Connection'}
                    </button>
                  </div>
                </div>
              )}

              {checkStartResult && (
                <div className={`p-2.5 border rounded-lg text-xs font-semibold ${
                  checkStartResult.started 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  {checkStartResult.started ? '✅ ' : '❌ '} {checkStartResult.message}
                </div>
              )}

              {simulatedCode && (
                <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 text-[11px] font-mono">
                  [Dev/Console OTP Code]: <strong>{simulatedCode}</strong>
                </div>
              )}
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Step 2: Enter One-Time Password (OTP)
                </label>
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-center tracking-widest font-mono text-xl border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon"
                />
                {(telegramTag || mobileNumber || dispatchedTo) && (
                  <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-start space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      OTP successfully sent to your registered Telegram / Mobile target: <strong className="font-mono text-emerald-800">{telegramTag ? `@${telegramTag.replace(/^@/, '')}` : (mobileNumber || dispatchedTo)}</strong>
                    </div>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || !otp}
                  className="flex-1 py-3.5 bg-darkblue hover:bg-blue-900 text-white font-bold rounded-xl shadow-xs transition-colors text-sm flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Verifying...' : 'View Application Status'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Live Application Status Pipeline View */}
        {step === 3 && applicationData && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-200 gap-3">
              <div>
                <h2 className="text-xl font-bold text-darkblue">{applicationData.fullName}</h2>
                <div className="text-xs text-gray-500 font-medium">
                  Section: <strong className="text-maroon">{applicationData.role}</strong> • Submitted {formatDateDDMMMYYYY(applicationData.createdAt)}
                </div>
              </div>

              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  (applicationData.status === 'Approved' || applicationData.status === 'Investiture') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  (applicationData.status === 'Interview & Investiture' || applicationData.status === 'Interview') ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  (applicationData.status === 'Pending Review' || applicationData.status === 'Processing') ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                  'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  Status: {applicationData.status}
                </span>
              </div>
            </div>

            {/* Pipeline Stage Tracker or Approved Big Card */}
            {(applicationData.status === 'Approved' || applicationData.status === 'Investiture') ? (
              <div className="p-8 bg-gradient-to-br from-emerald-50 via-emerald-100/40 to-teal-50 border-2 border-emerald-300 rounded-2xl text-center space-y-3 shadow-xs animate-in fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white font-extrabold text-sm rounded-full shadow-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approved</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-emerald-950">
                  Invested on {formatInvestitureDateDisplay(applicationData.investitureDate)}
                </div>
                <div className="text-sm font-semibold text-emerald-800">
                  Welcome to Arabiyya Rovers.
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                  Application Pipeline Progress
                </h3>

                {applicationData.status === 'Rejected' ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center space-x-3">
                    <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                    <div>
                      <strong>Application Status: Rejected</strong>
                      <p className="text-xs mt-1">Your application does not meet the current membership requirements for this cycle.</p>
                    </div>
                  </div>
                ) : applicationData.status === 'Suspended' || applicationData.status === 'Voluntary Suspension' || applicationData.status === 'Resigned' ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center space-x-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <strong>Application Status: {applicationData.status}</strong>
                      <p className="text-xs mt-1">Your membership is currently inactive.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Stage 1: Pending Review */}
                    <div className={`p-4 rounded-xl border text-center transition-all ${
                      currentStageNum >= 1 ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-gray-50 opacity-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold ${
                        currentStageNum >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        1
                      </div>
                      <div className="text-xs font-bold text-darkblue">1. Pending Review</div>
                      <div className="text-[11px] text-gray-500 mt-1">Application submission & initial review</div>
                    </div>

                    {/* Stage 2: Interview & Investiture */}
                    <div className={`p-4 rounded-xl border text-center transition-all ${
                      currentStageNum >= 2 ? 'border-amber-500 bg-amber-50/60' : 'border-gray-200 bg-gray-50 opacity-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold ${
                        currentStageNum >= 2 ? 'bg-amber-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        2
                      </div>
                      <div className="text-xs font-bold text-darkblue">2. Interview & Investiture</div>
                      <div className="text-[11px] text-gray-500 mt-1">Council interview & ceremony prep</div>
                    </div>

                    {/* Stage 3: Approved */}
                    <div className={`p-4 rounded-xl border text-center transition-all ${
                      currentStageNum >= 3 ? 'border-emerald-500 bg-emerald-50/60' : 'border-gray-200 bg-gray-50 opacity-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold ${
                        currentStageNum >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        3
                      </div>
                      <div className="text-xs font-bold text-darkblue">3. Approved</div>
                      <div className="text-[11px] text-gray-500 mt-1">Final membership & system access</div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Pending Notice */}
            {applicationData.status !== 'Approved' && applicationData.status !== 'Investiture' && applicationData.status !== 'Rejected' && applicationData.status !== 'Suspended' && applicationData.status !== 'Voluntary Suspension' && applicationData.status !== 'Resigned' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Pending Arabiyya Rover Council Action</span>
                </div>
                <p>
                  Please wait for a call from the Council regarding your candidate discussion. Once approved, the administrator will log your official Investiture Date to unlock system sign-in.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => {
                  setStep(1);
                  setApplicationData(null);
                }}
                className="px-4 py-2 border border-gray-300 text-xs font-bold text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Track Another Application
              </button>

              <button
                onClick={() => onNavigate('/signin')}
                className="px-5 py-2 bg-maroon text-white text-xs font-bold rounded-xl hover:bg-[#660000]"
              >
                Go to Sign In
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
