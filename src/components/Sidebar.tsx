import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { safeStorage } from '../utils/safeStorage';
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
  ChevronRight,
  Sparkles,
  Award,
  Users,
  Megaphone,
  GraduationCap,
  TrendingUp,
  Landmark,
  BookOpen,
  BookMarked
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPath, 
  onNavigate, 
  mobileOpen, 
  setMobileOpen 
}) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return safeStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Strict requirement: No sidebar while signed out on any page
  if (!user) {
    return null;
  }

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileOpen(false);
  };

  // Note: Profile link removed from primary nav as per requirements; accessible via profile card
  const navLinks = user ? [
    { name: 'Dashboard', path: '/dashboard', icon: Shield, badge: null },
    { name: 'Members', path: '/members', icon: Users, badge: null },
    { name: 'Courses', path: '/courses', icon: GraduationCap, badge: null },
    { name: 'Log Book', path: '/logbook', icon: BookMarked, badge: null },
    { name: 'Finance', path: '/finance', icon: Landmark, badge: null },
    { name: 'Events', path: '/events', icon: Calendar, badge: null },
    { name: 'Attendance', path: '/attendance', icon: CheckSquare, badge: null },
    { name: 'Progress', path: '/progress', icon: TrendingUp, badge: null },
    { name: 'Meeting Minutes', path: '/meeting-minutes', icon: FileText, badge: null },
    { name: 'Rover Policy', path: '/policy', icon: BookOpen, badge: null }
  ] : [
    { name: 'Dashboard', path: '/dashboard', icon: Shield, badge: null },
    { name: 'Join / Sign Up', path: '/join', icon: UserPlus, badge: null },
    { name: 'Sign In', path: '/signin', icon: LogIn, badge: null },
    { name: 'Track Status', path: '/track', icon: Search, badge: null },
    { name: 'Rover Policy', path: '/policy', icon: BookOpen, badge: null }
  ];

  // Quick bottom bar items for mobile screens
  const mobileBottomTabs = user ? [
    { name: 'Home', path: '/dashboard', icon: Shield },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Attendance', path: '/attendance', icon: CheckSquare },
  ] : [
    { name: 'Home', path: '/dashboard', icon: Shield },
    { name: 'Sign Up', path: '/join', icon: UserPlus },
    { name: 'Sign In', path: '/signin', icon: LogIn },
    { name: 'Track', path: '/track', icon: Search },
  ];

  return (
    <>
      {/* ========================================== */}
      {/* 1. MOBILE OFF-CANVAS SIDEBAR DRAWER OVERLAY*/}
      {/* ========================================== */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop blur overlay */}
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-[280px] max-w-[85vw] bg-white h-[100dvh] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80 shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Menu
              </span>

              <button 
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-colors"
                aria-label="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Identity Card on Mobile Drawer */}
            <div className="shrink-0">
              {user ? (
                <div 
                  onClick={() => handleNav('/profile')}
                  className="m-3 p-3.5 bg-darkblue text-white rounded-2xl shadow-xs border border-blue-900/60 cursor-pointer hover:border-sky-400/60 active:scale-[0.99] transition-all group"
                  title="View Profile"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-maroon text-white flex items-center justify-center font-bold text-sm shadow-xs border border-white/20 shrink-0">
                        {user.fullName.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold truncate text-white group-hover:text-sky-200 transition-colors">{user.fullName}</div>
                        <div className="text-[11px] text-sky-200 font-semibold flex items-center space-x-1 mt-0.5">
                          <Sparkles className="w-3 h-3 text-sky-300" />
                          <span>{user.role}</span>
                          {user.role === 'Secretary' ? <span className="text-amber-300 font-bold">• Secretary</span> : null}
                        </div>
                        <div className="text-[10px] font-mono text-sky-100/80 mt-0.5">
                          ID: {user.idCardNumber}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-sky-300/70 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => handleNav('/join')}
                  className="m-3 p-3.5 bg-darkblue text-white rounded-2xl shadow-xs border border-blue-900/60 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-maroon text-white flex items-center justify-center font-bold text-sm shadow-xs border border-white/20 shrink-0">
                      <UserPlus className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Join Arabiyya Rovers</div>
                      <div className="text-[11px] text-sky-200 font-medium">Press here to sign up</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links List (Scrollable middle container) */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {user ? 'Member Menu' : 'Public Access'}
              </div>

              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNav(link.path)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-50 text-sky-600 font-bold border border-sky-200 shadow-2xs'
                        : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600' : 'text-gray-500'}`} />
                      <span>{link.name}</span>
                    </div>
                    {link.badge ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                        {link.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`w-4 h-4 opacity-50 ${isActive ? 'text-sky-600' : 'text-gray-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Drawer Footer with bottom padding to clear the mobile bottom bar layout */}
            <div className="p-3 border-t border-gray-200 bg-gray-50/80 shrink-0 pb-16 md:pb-3">
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    handleNav('/signin');
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="text-center py-1">
                  <div className="text-[11px] font-bold text-darkblue">Arabiyya Members</div>
                  <div className="text-[9px] font-bold text-maroon uppercase tracking-wider">Arabiyya Rover Network</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. DESKTOP PERMANENT SIDEBAR (MD & ABOVE)   */}
      {/* ========================================== */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] sticky top-16 sm:top-18 shrink-0 z-30 shadow-2xs transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64 lg:w-72'
      }`}>
        
        {/* Sidebar Controls Top Bar */}
        <div className={`p-3 border-b border-gray-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">
              Navigation
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              const newState = !isCollapsed;
              setIsCollapsed(newState);
              safeStorage.setItem('sidebar-collapsed', String(newState));
            }}
            className="w-7 h-7 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-darkblue rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4 rotate-180" />
            )}
          </button>
        </div>

        {/* User Identity / Profile Card */}
        {user ? (
          <div className={`transition-all duration-300 ${isCollapsed ? 'mx-3 my-4' : 'm-4'}`}>
            <div 
              onClick={() => handleNav('/profile')}
              className={`bg-darkblue text-white rounded-2xl shadow-xs border border-blue-900/60 cursor-pointer hover:border-sky-400/60 hover:bg-[#0b1f3a] transition-all active:scale-[0.99] group ${
                isCollapsed ? 'p-2 flex justify-center' : 'p-3.5'
              }`}
              title={isCollapsed ? `${user.fullName} - View profile` : "View Member Profile"}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`flex items-center overflow-hidden ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                  <div className="w-10 h-10 rounded-xl bg-maroon text-white flex items-center justify-center font-bold text-sm shadow-xs border border-white/20 shrink-0">
                    {user.fullName.charAt(0)}
                  </div>
                  {!isCollapsed && (
                    <div className="overflow-hidden animate-in fade-in duration-300">
                      <div className="text-xs font-bold truncate text-white group-hover:text-sky-200 transition-colors">
                        {user.fullName}
                      </div>
                      <div className="text-[11px] text-sky-200 font-semibold flex items-center space-x-1 mt-0.5">
                        <Sparkles className="w-3 h-3 text-sky-300" />
                        <span>{user.role}</span>
                        {user.role === 'Secretary' ? <span className="text-amber-300 font-bold">• Secretary</span> : null}
                      </div>
                      <div className="text-[10px] font-mono text-sky-100/80 mt-0.5">
                        ID: {user.idCardNumber}
                      </div>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <ChevronRight className="w-4 h-4 text-sky-300/70 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => handleNav('/join')}
            className={`transition-all duration-300 cursor-pointer hover:border-amber-400/80 active:scale-[0.99] group bg-gradient-to-br from-darkblue to-[#0b1f3a] text-white rounded-2xl shadow-xs border border-blue-900/60 ${
              isCollapsed ? 'mx-3 my-4 p-2.5 flex justify-center' : 'm-4 p-3.5'
            }`}
            title={isCollapsed ? "Join Arabiyya Rovers" : undefined}
          >
            <div className="flex items-center space-x-3 justify-center">
              <div className="w-10 h-10 rounded-xl bg-maroon text-white flex items-center justify-center font-bold text-sm shadow-xs border border-white/20 shrink-0">
                <UserPlus className="w-5 h-5 text-amber-300" />
              </div>
              {!isCollapsed && (
                <div className="animate-in fade-in duration-300">
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Join Arabiyya Rovers</div>
                  <div className="text-[11px] text-sky-200 font-semibold">Press here to sign up</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className={`flex-1 py-2 space-y-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className={`py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider transition-all duration-300 text-center ${isCollapsed ? 'text-[9px]' : 'px-3 text-left'}`}>
            {isCollapsed ? (user ? 'Menu' : 'Pub') : (user ? 'Member Views' : 'Public Pages')}
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`relative w-full flex items-center rounded-xl text-xs font-bold transition-all ${
                  isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-sky-50 text-sky-600 border border-sky-200/80 shadow-2xs'
                    : 'text-gray-700 hover:text-darkblue hover:bg-gray-100'
                }`}
                title={isCollapsed ? link.name : undefined}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                  <div className="relative">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-gray-500'}`} />
                    {isCollapsed && link.badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
                    )}
                  </div>
                  {!isCollapsed && <span className="animate-in fade-in duration-300">{link.name}</span>}
                </div>
                {!isCollapsed && link.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full animate-in fade-in duration-300">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Desktop Footer */}
        <div className={`border-t border-gray-200 bg-gray-50/50 transition-all duration-300 ${isCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
          {user ? (
            <button
              onClick={() => {
                logout();
                handleNav('/signin');
              }}
              className={`flex items-center justify-center text-xs font-bold text-red-700 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-all shadow-2xs ${
                isCollapsed ? 'w-10 h-10 rounded-xl' : 'w-full space-x-2 px-3.5 py-2.5 rounded-xl'
              }`}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span className="animate-in fade-in duration-300">Sign Out</span>}
            </button>
          ) : (
            isCollapsed ? (
              <span className="text-[10px] font-bold text-maroon">{new Date().getFullYear()}</span>
            ) : (
              <div className="flex flex-col text-left text-[11px] text-gray-500 font-semibold px-1 w-full animate-in fade-in duration-300">
                <span className="font-bold text-darkblue">Arabiyya Members</span>
                <span className="text-[9px] text-maroon font-bold uppercase tracking-wider">Arabiyya Rover Network</span>
              </div>
            )
          )}
        </div>

      </aside>

      {/* ========================================== */}
      {/* 4. MOBILE BOTTOM NAVIGATION DOCK (Mobile)   */}
      {/* ========================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 flex justify-around items-center shadow-lg">
        {mobileBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => handleNav(tab.path)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-maroon font-bold scale-105'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-maroon' : 'text-gray-500'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">
                {tab.name}
              </span>
            </button>
          );
        })}

        {/* Extra Menu Trigger Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            mobileOpen ? 'text-maroon font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Menu className="w-5 h-5 text-gray-600" />
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">
            Menu
          </span>
        </button>
      </nav>
    </>
  );
};
