import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from './useAuth';
import { AppRoutes } from './routes';
import { progressApi } from '../features/progress/api';
import { isRequestCancelled } from '../lib/api/client';
import { OrientalDecorBackground } from '../components/OrientalDecorBackground';
import { CherryBlossomIntro } from '../components/CherryBlossomIntro';
import { Link, useLocation } from 'react-router-dom';
import {BrandLogo} from '../components/BrandLogo';
import { stopChineseSpeech } from '../services/chineseSpeech';

/** The breakpoint must match the `@media (max-width: 900px)` query in index.css. */
const MOBILE_BREAKPOINT_QUERY = '(max-width: 900px)';

/**
 * Track the mobile breakpoint with matchMedia - same source of truth as the CSS media query.
 *
 * The sidebar state used to be derived from `window.innerWidth` (an instant measurement that also
 * changes under pinch-zoom on iOS), so it could drift from CSS: JS assumed desktop and kept the
 * sidebar open while CSS still rendered it as a mobile overlay - the menu covered the whole screen
 * with no close button and no backdrop.
 */
function useIsMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

export function AppShell() {
  const { user, requireLogin, logout, changePassword } = useAuth();
  const { pathname, search } = useLocation();
  // Queries select learning content too; hash/state-only navigation keeps the current speech.
  useEffect(() => stopChineseSpeech, [pathname, search, user?.userId]);
  const isMobileLayout = useIsMobileLayout();
  /**
   * Manual user preference for the menu: `null` = not chosen yet -> follow the breakpoint default
   * (desktop starts open as a column, mobile closed). Derived directly during render, so rotating
   * the screen or resizing the window keeps it correct without a state-sync effect.
   */
  const [sidebarPreference, setSidebarPreference] = useState<boolean | null>(null);
  const sidebarDefaultOpen = !isMobileLayout;
  const isSidebarOpen = sidebarPreference ?? sidebarDefaultOpen;
  // The overlay only exists on mobile; on desktop the sidebar is a fixed column, so no backdrop is needed.
  const isSidebarOverlay = isMobileLayout && isSidebarOpen;
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [healthRetry, setHealthRetry] = useState(0);
  const healthController = useRef<AbortController | null>(null);
  const retryBackendHealth = useCallback(() => {
    // Invalidate the old response immediately, before React schedules the next effect.
    healthController.current?.abort();
    setHealthRetry(value => value + 1);
  }, []);
  // Real streak of the signed-in user - the topbar used to hardcode "3 ngày".
  const [streakCount, setStreakCount] = useState(0);

  const mobileOpenerRef = useRef<HTMLButtonElement | null>(null);
  const prevSidebarOpenRef = useRef(isSidebarOpen);

  // Return focus to the mobile opener button when the mobile drawer closes
  useEffect(() => {
    if (prevSidebarOpenRef.current && !isSidebarOpen && isMobileLayout) {
      mobileOpenerRef.current?.focus();
    }
    prevSidebarOpenRef.current = isSidebarOpen;
  }, [isSidebarOpen, isMobileLayout]);

  const closeSidebar = () => setSidebarPreference(false);
  const toggleSidebar = () => setSidebarPreference(!isSidebarOpen);

  // Lock background scrolling while the menu overlay is open on mobile
  useEffect(() => {
    if (!isSidebarOverlay) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOverlay]);

  // Esc closes the menu overlay (handy with an external keyboard or a resized desktop window).
  useEffect(() => {
    if (!isSidebarOverlay) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarPreference(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOverlay]);

  useEffect(() => {
    // Ping backend health check (/api/v1/health)
    const controller = new AbortController();
    healthController.current = controller;
    window.addEventListener('online', retryBackendHealth);
    progressApi.health( { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        setBackendHealthy(res.success && res.data?.status === 'UP');
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !isRequestCancelled(error)) setBackendHealthy(false);
      });
    return () => {
      controller.abort();
      if (healthController.current === controller) healthController.current = null;
      window.removeEventListener('online', retryBackendHealth);
    };
  }, [healthRetry, retryBackendHealth]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const controller = new AbortController();
    void progressApi.streak( { signal: controller.signal }).then((res) => {
      if (!controller.signal.aborted && res.success && res.data) {
        setStreakCount(res.data.currentStreak);
      }
    }).catch(() => { /* Cancellation is silent. */ });
    return () => controller.abort();
  }, [user]);

  /** Mobile: picking a nav item closes the drawer (desktop keeps it open as a column). */
  const handleNavigate = () => {
    if (isMobileLayout) {
      closeSidebar();
    }
  };

  /** Open sign-in and close the mobile drawer; otherwise its higher z-index hides the modal. */
  const openAuthModal = () => {
    requireLogin();
    if (isMobileLayout) {
      closeSidebar();
    }
  };

  return (
    <div className="relative z-[1] flex min-h-screen bg-bg">
      {/* Authentic Guochao Chinese Background Decor */}
      <div className="dashboard-atmosphere" aria-hidden="true" />
      <OrientalDecorBackground />
      <CherryBlossomIntro />

      {/* Menu backdrop: only rendered while the sidebar is open as a mobile overlay */}
      {isSidebarOverlay && (
        <div
          className="fixed inset-0 z-[95] bg-scrim"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        onNavigate={handleNavigate}
        onClose={closeSidebar}
        isOverlay={isMobileLayout}
        user={user}
        isOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onOpenAuthModal={openAuthModal}
        onLogout={() => { void logout(); }}
        onChangePassword={() => { changePassword(); if (isMobileLayout) closeSidebar(); }}
        streakCount={user ? streakCount : 0}
      />

      {/* Mobile: drawer opener button (desktop uses the edge tab attached to the sidebar) */}
      {isMobileLayout && <header inert={isSidebarOverlay?true:undefined} className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-2 bg-bg/95 px-2">
        <button
          ref={mobileOpenerRef}
          type="button"
          onClick={toggleSidebar}
          title="Mở thanh điều hướng"
          aria-label="Mở thanh điều hướng"
          aria-expanded={isSidebarOpen}
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent text-fg-60"
        >
          <Menu size={18} />
        </button>
        <Link to="/" aria-label="Jiayou — Trang chủ"><BrandLogo /></Link>
      </header>}

      {/* Main Content Area */}
      <div
        className={`relative flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-150 ${
          isSidebarOpen ? 'ml-[228px] max-[900px]:ml-0' : 'ml-0'
        }`}
      >
        {/* Upper-Left Traditional Chinese Ornaments (Vân Mây Như Ý & Hồi Văn Góc) — Tracks sidebar transition */}
        <div
          aria-hidden="true"
          className={`pointer-events-none select-none absolute top-2 z-0 w-[200px] h-[140px] opacity-[0.14] hidden sm:block transition-[left] duration-150 ${
            isSidebarOpen ? 'left-2 md:left-3' : 'left-8'
          }`}
        >
          <svg
            viewBox="0 0 200 140"
            fill="none"
            className="w-full h-full"
            aria-hidden="true"
          >
            {/* Subtle Imperial Meander Corner Flourish */}
            <path
              d="M 6 42 L 6 8 C 6 6.895 6.895 6 8 6 L 42 6 M 14 36 L 14 14 L 36 14"
              stroke="#E8B15C"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle cx="6" cy="46" r="1.5" fill="#FF8D73" />
            <circle cx="46" cy="6" r="1.5" fill="#FF8D73" />

            {/* Graceful Ruyi Cloud Motif (如意云纹) */}
            <path
              d="M 28 32 C 34 22, 50 20, 60 28 C 68 18, 86 18, 96 26 C 108 34, 104 50, 92 56 C 82 60, 72 54, 70 46 C 68 36, 78 32, 84 36"
              stroke="#FF8D73"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M 60 28 C 55 36, 44 38, 38 32"
              stroke="#E8B15C"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
            {/* Gentle trailing tendril flowing eastward into negative space */}
            <path
              d="M 96 26 C 114 20, 138 28, 154 38 Q 168 46, 178 44"
              stroke="#E8B15C"
              strokeWidth="0.8"
              strokeDasharray="2 3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <main
          inert={isSidebarOverlay ? true : undefined}
          className="relative z-[1] w-full min-w-0 flex-1 px-8 pb-36 pt-12 max-[900px]:px-5 max-[900px]:pb-28 max-[900px]:pt-20"
        >
          {backendHealthy === false && (
            <div className="mb-5 border-l-2 border-l-red bg-tint px-4 py-3 text-[12.5px] leading-[1.8] text-fg-60">
              Tạm thời không kết nối được với máy chủ. Vui lòng thử lại sau ít phút.
              <button type="button" onClick={retryBackendHealth} className="ml-2 cursor-pointer text-fg underline underline-offset-4">
                Kiểm tra lại kết nối
              </button>
              {import.meta.env.DEV && (
                <span className="mt-1 block text-fg-38">
                  Dev: backend chưa chạy hoặc đang cold start — <code className="border border-rule px-1 text-[12px]">mvn
                  spring-boot:run</code> trong <code className="border border-rule px-1 text-[12px]">backend</code> hoặc
                  Docker Compose.
                </span>
              )}
            </div>
          )}

          <AppRoutes />
        </main>
      </div>

    </div>
  );
}
