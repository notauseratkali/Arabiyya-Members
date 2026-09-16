import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogoImage } from '../components/LogoImage';
import { useLogo } from '../context/LogoContext';
import { fetchWithRetry } from '../utils/fetchUtils';
import { Search, UserPlus, ArrowRight, Lock } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  notice?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, notice }) => {
  const { login } = useAuth();
  const { refreshLogo } = useLogo();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    refreshLogo();
  }, [refreshLogo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetchWithRetry('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Authentication failed.');
        return;
      }

      login(data.user);
      onNavigate('/dashboard');
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
          <h1 className="text-2xl font-bold text-darkblue">Arabiyya Members</h1>
          <p className="text-xs font-bold text-maroon uppercase tracking-wider mt-0.5">
            Arabiyya Rover Network
          </p>
        </div>

        {notice && (
          <div className="mb-6 p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center space-x-2 text-xs text-darkblue font-semibold">
            <Lock className="w-4 h-4 text-maroon shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon focus:border-maroon"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-xs font-bold text-maroon hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon focus:border-maroon"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-maroon hover:bg-[#660000] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Secondary Navigation */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col space-y-2 text-center text-xs font-semibold">
          <button
            onClick={() => onNavigate('/track')}
            className="text-darkblue hover:text-blue-900 flex items-center justify-center space-x-1 py-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track Application Status</span>
          </button>
          <button
            onClick={() => onNavigate('/join')}
            className="text-maroon hover:underline flex items-center justify-center space-x-1 py-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Don't have an account? Join Arabiyya Rovers</span>
          </button>
        </div>

      </div>
    </div>
  );
};
