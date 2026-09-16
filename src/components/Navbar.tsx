import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogoImage } from './LogoImage';
import { 
  Shield, 
  Calendar, 
  CheckSquare, 
  User, 
  FileText, 
  Settings, 
  Inbox, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Search,
  Menu,
  X,
  Compass,
  Users
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  const navLinks = user ? [
    { name: 'Dashboard', path: '/dashboard', icon: Shield },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Our Events', path: '/events', icon: Calendar },
    { name: 'My Attendance', path: '/attendance', icon: CheckSquare },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Policy', path: '/policy', icon: FileText },
    ...((user.role === 'Secretary') ? [
      { name: 'Admin Requests', path: '/requests', icon: Inbox },
      { name: 'Settings', path: '/settings', icon: Settings }
    ] : [])
  ] : [
    { name: 'Join', path: '/join', icon: UserPlus },
    { name: 'Sign In', path: '/signin', icon: LogIn },
    { name: 'Track Status', path: '/track', icon: Search },
    { name: 'Rover Policy', path: '/policy', icon: FileText }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleNav(user ? '/dashboard' : '/signin')}
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-0.5 border border-sky-100 shadow-xs group-hover:border-sky-300 transition-colors">
              <LogoImage className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-bold text-darkblue tracking-tight block leading-none">
                Arabiyya Members
              </span>
              <span className="text-[10px] font-bold text-maroon uppercase tracking-wider block mt-0.5">
                Arabiyya Rover Network
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-600 font-bold border border-sky-200/80 shadow-2xs'
                      : 'text-gray-700 hover:text-darkblue hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action / Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-darkblue leading-tight">{user.fullName}</div>
                  <div className="text-[11px] font-semibold text-maroon">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    handleNav('/signin');
                  }}
                  title="Sign Out"
                  className="p-2 rounded-lg text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('/join')}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-colors shadow-xs flex items-center space-x-1.5"
              >
                <span>Join Now</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-darkblue hover:bg-gray-100 focus:outline-hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {user && (
            <div className="py-2 px-3 mb-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-bold text-darkblue">{user.fullName}</div>
              <div className="text-xs font-semibold text-maroon">{user.role} Account</div>
            </div>
          )}
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-maroon text-white font-bold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </button>
            );
          })}
          {user && (
            <button
              onClick={() => {
                logout();
                handleNav('/signin');
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-700 hover:bg-red-50 mt-2 border-t border-gray-100"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
