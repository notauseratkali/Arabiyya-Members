import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogoImage } from '../components/LogoImage';
import {
  Compass,
  Shield,
  Calendar,
  CheckSquare,
  BookMarked,
  BookOpen,
  ArrowLeft,
  Home,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Visual Graphic */}
        <div className="relative inline-block mx-auto">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
            <Compass className="w-12 h-12 sm:w-14 sm:h-14 text-amber-700 animate-spin-slow" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-md ring-2 ring-white">
            !
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-black tracking-wider uppercase">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>404 Error • Page Not Found</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-darkblue tracking-tight">
            Lost Your Trail?
          </h1>
          <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            The page or admin section you are trying to access does not exist, has been moved, or is restricted to authorized personnel.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate(user ? '/dashboard' : '/signin')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-darkblue hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>{user ? 'Return to Dashboard' : 'Go to Sign In'}</span>
          </button>

          <button
            onClick={() => onNavigate('/policy')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
          >
            <BookOpen className="w-4 h-4 text-gray-500" />
            <span>Rover Policy</span>
          </button>
        </div>

        {/* Quick Scout Hub Links */}
        {user && (
          <div className="pt-6 border-t border-gray-200/80">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
              Explore Active Rover Hubs
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onNavigate('/events')}
                className="p-3 rounded-xl bg-white border border-gray-200/80 hover:border-darkblue/30 hover:bg-sky-50/40 text-left transition-all group"
              >
                <Calendar className="w-4 h-4 text-darkblue mb-1" />
                <span className="text-xs font-bold text-darkblue block group-hover:text-blue-900">Events</span>
                <span className="text-[10px] text-gray-400 block">Upcoming schedule</span>
              </button>

              <button
                onClick={() => onNavigate('/attendance')}
                className="p-3 rounded-xl bg-white border border-gray-200/80 hover:border-darkblue/30 hover:bg-sky-50/40 text-left transition-all group"
              >
                <CheckSquare className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-xs font-bold text-darkblue block group-hover:text-blue-900">Attendance</span>
                <span className="text-[10px] text-gray-400 block">Roll & status</span>
              </button>

              <button
                onClick={() => onNavigate('/logbook')}
                className="p-3 rounded-xl bg-white border border-gray-200/80 hover:border-darkblue/30 hover:bg-sky-50/40 text-left transition-all group"
              >
                <BookMarked className="w-4 h-4 text-amber-600 mb-1" />
                <span className="text-xs font-bold text-darkblue block group-hover:text-blue-900">Log Book</span>
                <span className="text-[10px] text-gray-400 block">Service & camps</span>
              </button>

              <button
                onClick={() => onNavigate('/profile')}
                className="p-3 rounded-xl bg-white border border-gray-200/80 hover:border-darkblue/30 hover:bg-sky-50/40 text-left transition-all group"
              >
                <Shield className="w-4 h-4 text-purple-600 mb-1" />
                <span className="text-xs font-bold text-darkblue block group-hover:text-blue-900">My Profile</span>
                <span className="text-[10px] text-gray-400 block">Digital card</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
