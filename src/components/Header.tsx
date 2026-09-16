import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogoImage } from './LogoImage';
import { Menu, LayoutGrid, ExternalLink, Settings, Inbox, Megaphone, BookOpenCheck } from 'lucide-react';
import { fetchWithRetry } from '../utils/fetchUtils';

interface HeaderProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNavigate,
  onOpenMobileMenu 
}) => {
  const { user } = useAuth();
  const [apps, setApps] = React.useState<{ name: string; url: string }[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  const fetchApps = () => {
    fetchWithRetry('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.supported_apps) {
          setApps(data.supported_apps);
        }
      })
      .catch(err => console.error('[Header] Error loading supported apps:', err));
  };

  React.useEffect(() => {
    fetchApps();

    // Listen to settings update triggers
    const handleSettingsUpdate = () => {
      fetchApps();
    };
    window.addEventListener('arabiyya_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('arabiyya_settings_updated', handleSettingsUpdate);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/90 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo and Title - Absolute Left */}
          <div 
            onClick={() => onNavigate(user ? '/dashboard' : '/signin')}
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group shrink-0"
            title="Arabiyya Members"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center p-0.5 border border-sky-100 shadow-xs group-hover:border-sky-300 transition-all group-active:scale-95">
              <LogoImage className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold text-darkblue tracking-tight block leading-tight group-hover:text-blue-900 transition-colors">
                Arabiyya Members
              </span>
              <span className="text-[10px] font-bold text-maroon uppercase tracking-wider block">
                Arabiyya Rover Network
              </span>
            </div>
          </div>

          {/* Right Action Area (Mobile Drawer Toggle / Menu) */}
          <div className="flex items-center space-x-2 relative">
            
            {/* 4 Squares App Grid Launcher */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-xl transition-all shrink-0 flex items-center justify-center border ${
                  isOpen 
                    ? 'bg-sky-50 text-darkblue border-sky-100' 
                    : 'text-gray-600 hover:text-darkblue hover:bg-gray-100 border-transparent'
                }`}
                title="Supported Apps"
                aria-label="Supported Apps"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>

              {/* Dropdown Card */}
              {isOpen && (
                <>
                  {/* Backdrop Click-away */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsOpen(false)}
                  />
                  
                  <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl border border-gray-200/95 shadow-xl py-4 px-4 z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div>
                      <h4 className="text-xs font-black text-darkblue uppercase tracking-wider">
                        Admin Tools
                      </h4>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Portal administration & single sign-on.
                      </p>
                    </div>

                    <div className="border-t border-gray-100 my-2" />

                    {user?.role === 'Secretary' && (
                      <div className="space-y-1.5 pb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Crew Administration
                        </span>
                        <div className="grid grid-cols-1 gap-1">
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              onNavigate('/requests');
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-sky-50/50 border border-transparent hover:border-sky-100/40 transition-all text-left group cursor-pointer"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-xs font-bold shrink-0">
                                <Inbox className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-darkblue group-hover:text-blue-900 leading-tight">
                                  Admin Requests
                                </div>
                                <div className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">
                                  Verify joins & updates
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded-full shrink-0">
                              Sec
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setIsOpen(false);
                              onNavigate('/announcements');
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-sky-50/50 border border-transparent hover:border-sky-100/40 transition-all text-left group cursor-pointer"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-xs font-bold shrink-0">
                                <Megaphone className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-darkblue group-hover:text-blue-900 leading-tight">
                                  Announcements
                                </div>
                                <div className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">
                                  Broadcast news & alerts
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded-full shrink-0">
                              Sec
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setIsOpen(false);
                              onNavigate('/syllabus');
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-sky-50/50 border border-transparent hover:border-sky-100/40 transition-all text-left group cursor-pointer"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-xs font-bold shrink-0">
                                <BookOpenCheck className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-darkblue group-hover:text-blue-900 leading-tight">
                                  Syllabus
                                </div>
                                <div className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">
                                  Training scheme & curricula
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded-full shrink-0">
                              Sec
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setIsOpen(false);
                              onNavigate('/settings');
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-sky-50/50 border border-transparent hover:border-sky-100/40 transition-all text-left group cursor-pointer"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-xs font-bold shrink-0">
                                <Settings className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-darkblue group-hover:text-blue-900 leading-tight">
                                  Settings
                                </div>
                                <div className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">
                                  Schedules & configurations
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {user?.role === 'Secretary' && apps.length > 0 && (
                      <div className="border-t border-gray-100 my-1" />
                    )}

                    {apps.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Supported Apps (SSO)
                        </span>
                        <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                          {apps.map((app, index) => (
                            <a
                              key={index}
                              href={app.url}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all text-left group"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-sky-50 text-darkblue flex items-center justify-center text-xs font-extrabold uppercase shrink-0">
                                  {app.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-darkblue group-hover:text-blue-900 leading-tight truncate">
                                    {app.name}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono truncate max-w-[155px]">
                                    {app.url.replace(/^https?:\/\//, '')}
                                  </div>
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-darkblue transition-colors shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {apps.length === 0 && user?.role !== 'Secretary' && (
                      <div className="text-center py-4 text-xs text-gray-400 font-medium">
                        No apps listed yet.
                      </div>
                    )}


                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Drawer Toggle Button - Visible only on mobile when logged in */}
            {user && onOpenMobileMenu && (
              <button
                onClick={onOpenMobileMenu}
                className="md:hidden p-2 rounded-xl text-gray-600 hover:text-darkblue hover:bg-gray-100 transition-colors focus:outline-hidden shrink-0"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
