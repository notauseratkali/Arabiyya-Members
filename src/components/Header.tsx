import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogoImage } from './LogoImage';
import {
  Menu,
  LayoutGrid,
  ExternalLink,
  Settings,
  Inbox,
  Megaphone,
  BookOpenCheck,
  CheckCircle2,
  Check,
  Clock,
  Sparkles,
  ChevronRight,
  Bell
} from 'lucide-react';
import { fetchWithRetry } from '../utils/fetchUtils';
import { formatDateDDMMMYYYY } from '../utils/dateUtils';
import { AnnouncementItem } from '../types';

interface HeaderProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentPath,
  onNavigate,
  onOpenMobileMenu 
}) => {
  const { user, isSecretary } = useAuth();
  const [apps, setApps] = useState<{ name: string; url: string }[]>([]);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  
  // Announcements & Notifications State (Per Member)
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const announcementsRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<HTMLDivElement>(null);

  const fetchApps = () => {
    fetchWithRetry('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.supported_apps && Array.isArray(data.supported_apps)) {
          setApps(data.supported_apps);
        }
      })
      .catch(() => {});
  };

  const fetchAnnouncements = () => {
    if (!user) {
      setAnnouncements([]);
      setUnreadCount(0);
      return;
    }

    const memberQuery = user.id ? `?memberId=${encodeURIComponent(user.id)}` : '';
    fetchWithRetry(`/api/announcements${memberQuery}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAnnouncements(data);
          const unread = data.filter(item => item && !item.isRead).length;
          setUnreadCount(unread);
        } else {
          setAnnouncements([]);
          setUnreadCount(0);
        }
      })
      .catch(() => {
        setAnnouncements([]);
        setUnreadCount(0);
      });
  };

  const handleMarkRead = async (announcementId?: string, all = false) => {
    if (!user) return;
    try {
      const res = await fetchWithRetry('/api/announcements/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: user.id,
          announcementId,
          all
        })
      });
      const data = await res.json();
      if (data && data.success) {
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
        setAnnouncements(prev =>
          prev.map(ann => {
            if (all || (announcementId && ann.id === announcementId)) {
              return { ...ann, isRead: true };
            }
            return ann;
          })
        );
        window.dispatchEvent(new CustomEvent('arabiyya_announcements_updated'));
      }
    } catch (err) {
      console.error('[Header] Error marking announcement read:', err);
    }
  };

  useEffect(() => {
    fetchApps();
    fetchAnnouncements();

    const handleSettingsUpdate = () => fetchApps();
    const handleAnnouncementsUpdate = () => fetchAnnouncements();

    window.addEventListener('arabiyya_settings_updated', handleSettingsUpdate);
    window.addEventListener('arabiyya_announcements_updated', handleAnnouncementsUpdate);

    // Periodic check for new notifications every 25 seconds
    const interval = setInterval(fetchAnnouncements, 25000);

    return () => {
      window.removeEventListener('arabiyya_settings_updated', handleSettingsUpdate);
      window.removeEventListener('arabiyya_announcements_updated', handleAnnouncementsUpdate);
      clearInterval(interval);
    };
  }, [user?.id]);

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Urgent':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Important':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Event':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Investiture':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Training':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-blue-100 text-darkblue border-blue-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/90 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo and Title - Absolute Left (Kept clean and intact) */}
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

          {/* Right Action Area */}
          <div className="flex items-center space-x-2 relative">
            
            {/* ANNOUNCEMENTS & NOTIFICATIONS IN HEADER (Per Member with Red Unread Mark) */}
            {user && (
              <div className="relative" ref={announcementsRef}>
                <button
                  onClick={() => {
                    setIsAnnouncementsOpen(!isAnnouncementsOpen);
                    setIsAppsOpen(false);
                  }}
                  className={`relative p-2 sm:px-3 sm:py-2 rounded-xl transition-all shrink-0 flex items-center space-x-1.5 border ${
                    isAnnouncementsOpen || currentPath === '/announcements'
                      ? 'bg-blue-50 text-darkblue border-blue-200 shadow-2xs'
                      : 'text-gray-700 hover:text-darkblue hover:bg-gray-100 border-gray-200/80'
                  }`}
                  title="Announcements & Notifications"
                  aria-label="Announcements & Notifications"
                >
                  <Megaphone className="w-5 h-5 text-darkblue" />
                  <span className="hidden sm:inline text-xs font-bold text-darkblue">
                    Announcements
                  </span>
                  
                  {/* RED UNREAD NOTIFICATIONS BADGE WITH COUNT */}
                  {unreadCount > 0 && (
                    <span 
                      className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-sm animate-in zoom-in-75 duration-150"
                      title={`${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Announcements Notification Dropdown Popover */}
                {isAnnouncementsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsAnnouncementsOpen(false)}
                    />
                    
                    <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200/95 shadow-2xl py-3 px-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-darkblue flex items-center justify-center">
                            <Megaphone className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-darkblue uppercase tracking-wider">
                              Announcements
                            </h4>
                            <p className="text-[10px] text-gray-500 font-medium">
                              {unreadCount > 0 
                                ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` 
                                : 'All caught up!'}
                            </p>
                          </div>
                        </div>

                        {unreadCount > 0 && (
                          <button
                            onClick={() => handleMarkRead(undefined, true)}
                            className="text-[10px] font-bold text-darkblue hover:text-blue-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      {/* Notification List */}
                      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto my-1.5 pr-0.5 space-y-1">
                        {announcements.length === 0 ? (
                          <div className="py-8 text-center text-gray-400">
                            <Megaphone className="w-8 h-8 mx-auto text-gray-300 mb-1.5 stroke-[1.5]" />
                            <p className="text-xs font-semibold">No announcements yet</p>
                            <p className="text-[10px]">Official broadcasts will appear here.</p>
                          </div>
                        ) : (
                          announcements.slice(0, 5).map((ann) => (
                            <div
                              key={ann.id}
                              onClick={() => {
                                if (!ann.isRead) {
                                  handleMarkRead(ann.id, false);
                                }
                                setIsAnnouncementsOpen(false);
                                onNavigate('/announcements');
                              }}
                              className={`p-2.5 rounded-xl transition-all cursor-pointer text-left group ${
                                !ann.isRead 
                                  ? 'bg-rose-50/40 hover:bg-rose-50 border border-rose-100/70' 
                                  : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1.5 mb-1">
                                <div className="flex items-center space-x-1.5 flex-wrap">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase ${getCategoryBadgeClass(ann.category)}`}>
                                    {ann.category}
                                  </span>
                                  {!ann.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-pulse" title="Unread" />
                                  )}
                                </div>
                                <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">
                                  {formatDateDDMMMYYYY(ann.dispatchedAt || ann.createdAt)}
                                </span>
                              </div>

                              <h5 className="text-xs font-bold text-darkblue group-hover:text-blue-900 leading-snug line-clamp-1">
                                {ann.title}
                              </h5>
                              <p className="text-[11px] text-gray-600 leading-normal line-clamp-2 mt-0.5">
                                {ann.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setIsAnnouncementsOpen(false);
                            onNavigate('/announcements');
                          }}
                          className="w-full text-center text-xs font-bold text-darkblue hover:text-blue-900 py-1.5 rounded-xl hover:bg-sky-50 transition-colors flex items-center justify-center space-x-1"
                        >
                          <span>View All Announcements</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 4 Squares App Grid Launcher - ONLY visible for Admin / Secretary */}
            {isSecretary && (
              <div className="relative" ref={appsRef}>
                <button
                  onClick={() => {
                    setIsAppsOpen(!isAppsOpen);
                    setIsAnnouncementsOpen(false);
                  }}
                  className={`p-2 rounded-xl transition-all shrink-0 flex items-center justify-center border ${
                    isAppsOpen 
                      ? 'bg-sky-50 text-darkblue border-sky-100 shadow-2xs' 
                      : 'text-gray-600 hover:text-darkblue hover:bg-gray-100 border-transparent'
                  }`}
                  title="Admin Tools"
                  aria-label="Admin Tools"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>

                {/* Dropdown Card */}
                {isAppsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsAppsOpen(false)}
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

                      <div className="space-y-1.5 pb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Crew Administration
                        </span>
                        <div className="grid grid-cols-1 gap-1">
                          <button
                            onClick={() => {
                              setIsAppsOpen(false);
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
                              setIsAppsOpen(false);
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
                              setIsAppsOpen(false);
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
                              setIsAppsOpen(false);
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

                      {apps.length > 0 && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
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
                        </>
                      )}

                    </div>
                  </>
                )}
              </div>
            )}

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
