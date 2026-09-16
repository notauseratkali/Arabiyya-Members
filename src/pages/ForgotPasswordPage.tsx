import React, { useState, useEffect } from 'react';
import { LogoImage } from '../components/LogoImage';
import { useLogo } from '../context/LogoContext';
import { KeyRound, ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2, Send } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { refreshLogo } = useLogo();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [idCardNumber, setIdCardNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [obfuscatedEmail, setObfuscatedEmail] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idCardNumber })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to dispatch verification code.');
        return;
      }

      if (data.botLink) setBotLink(data.botLink);
      if (data.botUsername) setBotUsername(data.botUsername);
      if (data.requireStart) setRequireStart(true);
      if (data.otpCode) setSimulatedCode(data.otpCode);
      setTelegramTag(data.telegramTag || '');
      setMobileNumber(data.mobileNumber || '');
      setDispatchedTo(data.dispatchedTo || '');

      setObfuscatedEmail(data.email);
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

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idCardNumber, otp, newPassword })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Password reset failed.');
        return;
      }

      setSuccessMsg(data.message);
      setStep(3);
    } catch (err) {
      setLoading(false);
      setErrorMsg('Server connection error.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white border border-sky-100 rounded-2xl flex items-center justify-center p-1 mx-auto mb-3 shadow-xs">
            <LogoImage className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-darkblue">Reset Your Password</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Enter your registered ID Card Number to receive a One-Time Password (OTP) for identity verification.
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            {/* Telegram Bot Direct DM Guidance */}
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center space-x-1.5 text-sky-950 uppercase tracking-wider text-[11px]">
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  <span>Private Direct Message Delivery</span>
                </span>
              </div>
              <p className="leading-relaxed text-sky-900">
                Password reset OTPs are sent <strong>exclusively to your personal Telegram DM</strong>.
              </p>
              <div>
                <a
                  href={botLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open {botUsername} on Telegram & click /start</span>
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                ID Card Number
              </label>
              <input
                type="text"
                placeholder="e.g. A123456"
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon uppercase"
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
              <span>{loading ? 'Sending Private Telegram OTP...' : 'Send Private OTP via Telegram Bot'}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-950 space-y-2">
              <div className="flex items-start space-x-2">
                <Send className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sky-950 font-bold mb-0.5">Private Telegram Bot OTP Dispatched</strong>
                  <p className="text-sky-900 leading-relaxed">
                    Verification code sent directly to your private Telegram chat handle.
                  </p>
                </div>
              </div>

              {requireStart && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 text-xs font-semibold space-y-1.5">
                  <p>⚠️ Haven't received the private message yet?</p>
                  <p className="font-normal text-[11px]">
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
                      <span>Open {botUsername} & tap /start</span>
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
                <div className="p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 text-[11px] font-mono">
                  [Console/Dev OTP Code]: <strong>{simulatedCode}</strong>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Enter OTP
              </label>
              <input
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl font-mono text-center tracking-widest text-lg"
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

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !otp || !newPassword}
              className="w-full py-3.5 bg-maroon hover:bg-[#660000] text-white font-bold rounded-xl shadow-xs transition-colors text-sm"
            >
              {loading ? 'Resetting Password...' : 'Reset Password & Log In'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-emerald-900 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              {successMsg || 'Password successfully reset!'}
            </p>
            <button
              onClick={() => onNavigate('/signin')}
              className="w-full py-3 bg-darkblue hover:bg-blue-900 text-white font-bold rounded-xl shadow-xs transition-colors text-sm"
            >
              Proceed to Sign In
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <button
            onClick={() => onNavigate('/signin')}
            className="text-xs font-bold text-gray-600 hover:text-darkblue flex items-center justify-center space-x-1 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>
        </div>

      </div>
    </div>
  );
};
