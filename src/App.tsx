import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogoProvider } from './context/LogoContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { LogoImage } from './components/LogoImage';

// Pages
import { JoinPage } from './pages/JoinPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { TrackPage } from './pages/TrackPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { AttendancePage } from './pages/AttendancePage';
import { ProfilePage } from './pages/ProfilePage';
import { MembersPage } from './pages/MembersPage';
import { PolicyPage } from './pages/PolicyPage';
import { RequestsPage } from './pages/RequestsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { MeetingMinutesPage } from './pages/MeetingMinutesPage';
import { CoursesPage } from './pages/CoursesPage';
import { LogBookPage } from './pages/LogBookPage';
import { ProgressPage } from './pages/ProgressPage';
import { SyllabusPage } from './pages/SyllabusPage';
import { FinancePage } from './pages/FinancePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { safeStorage } from './utils/safeStorage';

function getNormalizedPath(): string {
  let raw = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;

  if (search && search.includes('p=')) {
    const match = search.match(/[?&]p=([^&]*)/);
    if (match && match[1]) {
      raw = decodeURIComponent(match[1]).replace(/~and~/g, '&');
    }
  } else if (hash && hash.startsWith('#/')) {
    raw = hash.slice(1);
  }

  let clean = raw.replace(/\/+$/, '');
  if (!clean) clean = '/';

  const knownRoutes = [
    '/signin', '/join', '/signup', '/forgot-password', '/track', '/policy',
    '/dashboard', '/events', '/attendance', '/meeting-minutes', '/profile',
    '/members', '/courses', '/logbook', '/log-book', '/progress', '/finance',
    '/syllabus', '/requests', '/announcements', '/settings', '/admin',
    '/admin/requests', '/admin/settings', '/admin/syllabus'
  ];

  let result = clean;
  if (clean === '/login') result = '/signin';
  else if (!knownRoutes.includes(clean)) {
    for (const r of knownRoutes) {
      if (clean.endsWith(r)) {
        result = r;
        break;
      }
    }
  }

  console.log('[Router] getNormalizedPath =>', {
    pathname: window.location.pathname,
    search,
    hash,
    raw,
    clean,
    result
  });

  return result;
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [splashActive, setSplashActive] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const norm = getNormalizedPath();
    const savedUser = safeStorage.getItem('arabiyya_auth_user');
    let initPath = norm;
    if (norm === '/' || norm === '/login') {
      initPath = savedUser ? '/dashboard' : '/signin';
    }
    console.log('[AppContent] Initial path state computed:', { norm, hasSavedUser: !!savedUser, initPath });
    return initPath;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const touchStartX = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;

    if (deltaX > 50 && !mobileSidebarOpen && window.innerWidth < 768) {
      setMobileSidebarOpen(true);
    } else if (deltaX < -50 && mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashActive(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const navigate = (path: string) => {
    let targetPath = (!path || path === '/' || path === '/login') ? (user ? '/dashboard' : '/signin') : path;
    if (targetPath === '/login') targetPath = '/signin';
    
    const publicRoutes = ['/signin', '/join', '/signup', '/forgot-password', '/track', '/policy'];
    if (!user && !publicRoutes.includes(targetPath)) {
      targetPath = '/signin';
    }

    console.log('[AppContent] navigate requested:', { requested: path, resolved: targetPath, hasUser: !!user });
    window.history.pushState({}, '', targetPath);
    setCurrentPath(targetPath);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      const norm = getNormalizedPath();
      let targetPath = (norm === '/' || norm === '/login') ? (user ? '/dashboard' : '/signin') : norm;
      const publicRoutes = ['/signin', '/join', '/signup', '/forgot-password', '/track', '/policy'];
      if (!user && !publicRoutes.includes(targetPath)) {
        targetPath = '/signin';
      }
      console.log('[AppContent] popstate event handled:', { norm, targetPath, hasUser: !!user });
      setCurrentPath(targetPath);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Route protection and redirection
  useEffect(() => {
    console.log('[AppContent] Protection Effect evaluate:', { currentPath, isLoading, userEmail: user?.email });

    if (isLoading) return;

    if (window.location.search && window.location.search.includes('p=')) {
      const cleanPath = currentPath || (user ? '/dashboard' : '/signin');
      console.log('[AppContent] Cleaning up ?p= parameter => replaceState to:', cleanPath);
      window.history.replaceState({}, '', cleanPath);
    }

    const publicRoutes = ['/signin', '/join', '/signup', '/forgot-password', '/track', '/policy'];

    if (!user) {
      if (!publicRoutes.includes(currentPath) || currentPath === '/login' || currentPath === '/') {
        console.log('[AppContent] Unauthenticated access => redirecting to /signin');
        window.history.replaceState({}, '', '/signin');
        setCurrentPath('/signin');
      }
    }
  }, [user, isLoading, currentPath]);

  const renderPage = () => {
    console.log('[AppContent] renderPage rendering:', { currentPath, userEmail: user?.email });

    // Public pages accessible to all users (unauthenticated and authenticated)
    if (currentPath === '/login' || currentPath === '/signin') {
      return <LoginPage onNavigate={navigate} />;
    }
    if (currentPath === '/join' || currentPath === '/signup') {
      return <JoinPage onNavigate={navigate} />;
    }
    if (currentPath === '/forgot-password') {
      return <ForgotPasswordPage onNavigate={navigate} />;
    }
    if (currentPath === '/track') {
      return <TrackPage onNavigate={navigate} />;
    }
    if (currentPath === '/policy') {
      return <PolicyPage onNavigate={navigate} />;
    }

    // 2. If logged out, render LoginPage
    if (!user) {
      return <LoginPage onNavigate={navigate} />;
    }

    // 3. Authenticated member pages
    switch (currentPath) {
      case '/dashboard':
      case '/':
        return <DashboardPage onNavigate={navigate} />;
      case '/events':
        return <EventsPage onNavigate={navigate} />;
      case '/attendance':
        return <AttendancePage onNavigate={navigate} />;
      case '/meeting-minutes':
        return <MeetingMinutesPage onNavigate={navigate} />;
      case '/profile':
        return <ProfilePage onNavigate={navigate} />;
      case '/members':
        return <MembersPage onNavigate={navigate} />;
      case '/courses':
        return <CoursesPage onNavigate={navigate} />;
      case '/logbook':
      case '/log-book':
        return <LogBookPage onNavigate={navigate} />;
      case '/progress':
        return <ProgressPage onNavigate={navigate} />;
      case '/policy':
        return <PolicyPage onNavigate={navigate} />;
      case '/finance':
        return <FinancePage onNavigate={navigate} />;
      case '/syllabus':
        return ((user.role === 'Admin' || user.role === 'Secretary') || user.isAdmin === true) 
          ? <SyllabusPage onNavigate={navigate} /> 
          : <NotFoundPage onNavigate={navigate} />;
      case '/requests':
        return ((user.role === 'Admin' || user.role === 'Secretary') || user.isAdmin === true) 
          ? <RequestsPage onNavigate={navigate} /> 
          : <NotFoundPage onNavigate={navigate} />;
      case '/announcements':
        return <AnnouncementsPage onNavigate={navigate} />;
      case '/settings':
        return ((user.role === 'Admin' || user.role === 'Secretary') || user.isAdmin === true) 
          ? <SettingsPage onNavigate={navigate} /> 
          : <NotFoundPage onNavigate={navigate} />;
      case '/admin':
      case '/admin/requests':
      case '/admin/settings':
      case '/admin/syllabus':
        return ((user.role === 'Admin' || user.role === 'Secretary') || user.isAdmin === true) 
          ? <RequestsPage onNavigate={navigate} /> 
          : <NotFoundPage onNavigate={navigate} />;
      default:
        return <NotFoundPage onNavigate={navigate} />;
    }
  };

  const showLoader = false;

  return (
    <div 
      className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900 antialiased selection:bg-maroon selection:text-white relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence>
        {showLoader && (
          <motion.div
            key="page-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white pointer-events-auto select-none"
          >
            <div className="flex flex-col items-center justify-center text-center w-28 mx-auto">
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  filter: [
                    "drop-shadow(0px 0px 0px rgba(128,0,0,0))", 
                    "drop-shadow(0px 4px 12px rgba(128,0,0,0.15))", 
                    "drop-shadow(0px 0px 0px rgba(128,0,0,0))"
                  ]
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-28 h-28 flex items-center justify-center p-0.5 mb-4"
              >
                <LogoImage className="w-full h-full object-contain mx-auto" />
              </motion.div>
              <motion.span 
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-28 text-[11px] font-black text-darkblue uppercase block whitespace-nowrap text-center tracking-normal pl-[1px] pr-[1px]"
              >
                Arabiyya Rovers
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Header rendered across ALL pages */}
      <Header 
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenMobileMenu={user ? () => setMobileSidebarOpen(true) : undefined}
      />

      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        {/* Strictly no sidebar while signed out on any page */}
        {user && (
          <Sidebar 
            currentPath={currentPath} 
            onNavigate={navigate} 
            mobileOpen={mobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
          />
        )}
        <div className={`flex-1 flex flex-col min-w-0 ${user ? 'pb-16 md:pb-0' : ''}`}>
          <main className="flex-1">
            {renderPage()}
          </main>
          <Footer onNavigate={navigate} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LogoProvider>
        <AppContent />
      </LogoProvider>
    </AuthProvider>
  );
}
