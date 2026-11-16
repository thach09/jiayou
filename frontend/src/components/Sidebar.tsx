import { useEffect, useRef } from 'react';
import type { ElementType } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Home,
  Layers,
  Shield,
  Target,
  X,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import type { AuthResponse } from '../lib/api/types';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  onNavigate?: () => void;
  user: AuthResponse | null;
  isOpen?: boolean;
  isOverlay?: boolean;
  onClose?: () => void;
  onToggleSidebar?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onChangePassword?: () => void;
  streakCount?: number;
}

/** Pinyin outline icon 'Aa' matching the approved design reference */
function AaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className || 'w-5 h-5 shrink-0'}
      aria-hidden="true"
    >
      <path d="M3.5 18L8.5 6L13.5 18" />
      <path d="M5.5 13.5H11.5" />
      <path d="M16 12C14.6 12 13.5 13 13.5 14.5C13.5 16 14.6 17 16 17C17.2 17 18.2 16.2 18.5 15V18" />
      <path d="M18.5 13.5V11C18.5 10 17.5 9.5 16 9.5" />
    </svg>
  );
}

/** Chinese Character outline icon '字' matching the approved design reference */
function HanziIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className || 'w-5 h-5 shrink-0'}
      aria-hidden="true"
    >
      <path d="M12 3V5.5" />
      <path d="M4.5 8H19.5" />
      <path d="M5.5 8.5V11" />
      <path d="M18.5 8.5V11" />
      <path d="M7 12.5H16.5L12 16" />
      <path d="M11.8 11V20.5" />
      <path d="M8 15.5H16.5" />
    </svg>
  );
}

/** Dictionary icon matching the approved design reference */
function DictionaryIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className || 'w-5 h-5 shrink-0'}
      aria-hidden="true"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" />
      <circle cx="11.5" cy="9.5" r="2.5" />
      <path d="M13.5 11.5L16 14" />
    </svg>
  );
}

const stations: readonly [string, string, ElementType][] = [
  ['/', 'Hôm nay', Home],
  ['/pinyin', 'Pinyin', AaIcon],
  ['/hanzi', 'Chữ Hán', HanziIcon],
  ['/vocabulary', 'Từ vựng', BookOpen],
  ['/dictionary', 'Từ điển', DictionaryIcon],
  ['/grammar', 'Ngữ pháp', Layers],
  ['/exam', 'Luyện tập', Target],
] as const;

export function Sidebar({
  user,
  isOpen = true,
  isOverlay = false,
  onNavigate,
  onClose,
  onToggleSidebar,
  onOpenAuthModal,
}: SidebarProps) {
  const aside = useRef<HTMLElement>(null),
    toggle = useRef<HTMLButtonElement>(null),
    close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOverlay && isOpen) close.current?.focus();
    if (
      !isOverlay &&
      !isOpen &&
      aside.current?.contains(document.activeElement) &&
      document.activeElement !== toggle.current
    )
      toggle.current?.focus();
  }, [isOverlay, isOpen]);

  return (
    <aside
      ref={aside}
      aria-label="Thanh điều hướng chính"
      inert={isOverlay && !isOpen ? true : undefined}
      className={`app-sidebar fixed inset-y-0 left-0 z-20 flex w-[228px] flex-col overflow-visible px-4 pb-5 pt-6 transition-transform duration-150 max-[900px]:z-[100] max-[900px]:w-[min(280px,82vw)] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {!isOverlay && onToggleSidebar && (
        <button
          ref={toggle}
          type="button"
          onClick={() => {
            onToggleSidebar();
            requestAnimationFrame(() => toggle.current?.focus());
          }}
          aria-label={
            isOpen ? 'Thu gọn thanh điều hướng' : 'Mở thanh điều hướng'
          }
          className="absolute -right-6 top-7 z-40 flex h-10 w-6 items-center justify-center rounded-r-md border border-l-0 border-rule bg-sidebar text-fg-60 hover:text-fg hover:bg-sidebar-hover transition-colors"
        >
          <ChevronLeft size={14} className={isOpen ? '' : 'rotate-180'} />
        </button>
      )}

      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        inert={!isOpen ? true : undefined}
      >
        {/* Traditional Chinese Corner Flourish (Góc hoa văn cung đình) */}
        <svg
          aria-hidden="true"
          viewBox="0 0 40 40"
          className="absolute top-2 right-2 w-7 h-7 text-cinnabar opacity-[0.12] pointer-events-none select-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M 4 36 L 4 12 C 4 7.5, 7.5 4, 12 4 L 36 4" />
          <path d="M 9 32 L 9 14 C 9 11.2, 11.2 9, 14 9 L 32 9" />
          <circle cx="16" cy="16" r="2.5" fill="currentColor" opacity="0.6" />
        </svg>

        {/* Top: Logo with no Chinese subtitle and no marketing slogan */}
        <div className="flex items-center justify-between gap-2 px-1">
          <Link
            to="/"
            aria-label="Jiayou — Trang chủ"
            onClick={onNavigate}
            className="flex items-center gap-2"
          >
            <BrandLogo />
          </Link>
          {isOverlay && onClose && (
            <button
              ref={close}
              onClick={onClose}
              aria-label="Đóng thanh điều hướng"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-fg-60 hover:text-fg hover:bg-white/[0.05]"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav
          className="mt-6 flex flex-col gap-1.5"
          aria-label="Các mục chính"
        >
          {[
            ...stations,
            ...(user?.role === 'ROLE_ADMIN'
              ? ([['/admin', 'Quản trị', Shield]] as const)
              : []),
          ].map(([to, label, Icon]) => (
            <div key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `app-nav-link flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[14px] transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-[rgba(255,141,115,0.20)] to-[rgba(255,141,115,0.06)] border border-cinnabar/38 text-fg font-medium shadow-[0_0_14px_rgba(255,141,115,0.15)]'
                      : 'text-fg-60 hover:text-fg hover:bg-white/[0.04] border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? 'text-cinnabar' : 'text-fg-60'
                      }`}
                    />
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            </div>
          ))}
        </nav>

        {/* Traditional Meander & Ruyi Divider (Đường phân cách Hồi Văn & Vân Lôi) */}
        <div className="relative w-full flex items-center justify-center my-2 select-none pointer-events-none" aria-hidden="true">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,180,140,0.2)] to-[rgba(255,180,140,0.06)]" />
          <svg
            viewBox="0 0 32 12"
            className="w-7 h-2.5 mx-2 text-cinnabar opacity-[0.24] shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M 2 6 L 8 6 L 8 2 L 14 2 L 14 10 L 18 10 L 18 2 L 24 2 L 24 6 L 30 6" />
          </svg>
          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-[rgba(255,180,140,0.2)] to-[rgba(255,180,140,0.06)]" />
        </div>

        {/* Bottom account block matching approved single-entry requirement */}
        <div className="relative mt-auto pt-1 flex flex-col gap-2.5">
          {/* Authentic Chinese Ruyi Cloud Watermark (Mây Như Ý Cát Tường) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 160 55"
            className="absolute -top-11 right-1 w-32 h-11 text-cinnabar opacity-[0.09] pointer-events-none select-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M 12 42 C 18 28, 36 28, 44 38 C 50 24, 72 22, 82 32 C 92 18, 118 18, 128 32 C 136 26, 148 28, 152 38" />
            <path d="M 26 38 C 28 30, 36 30, 40 35" />
            <path d="M 62 33 C 65 26, 75 26, 80 32" />
            <path d="M 102 32 C 105 24, 115 24, 120 30" />
          </svg>

          {/* Bottom-left subtle corner flourish */}
          <svg
            aria-hidden="true"
            viewBox="0 0 36 36"
            className="absolute -bottom-2 -left-2 w-6 h-6 text-cinnabar opacity-[0.08] pointer-events-none select-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
          >
            <path d="M 32 4 L 32 24 C 32 28.4, 28.4 32, 24 32 L 4 32" />
            <path d="M 27 9 L 27 22 C 27 24.8, 24.8 27, 22 27 L 9 27" />
          </svg>

          {user ? (
            <Link
              to="/toi"
              onClick={onNavigate}
              aria-label="Tôi"
              className="flex items-center justify-between gap-2.5 p-2 rounded-xl border border-rule bg-[rgba(34,25,27,0.92)] hover:border-[rgba(255,180,140,0.35)] hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/40 text-base border border-rule">
                  🐼
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-fg truncate leading-tight">
                    {user.fullName || 'Người học'}
                  </p>
                </div>
              </div>
              <ChevronRight size={14} className="text-fg-60 group-hover:text-fg group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ) : (
            <div className="flex items-center justify-between gap-2">
              {onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className="dashboard-action primary text-xs !min-h-[36px] !py-1.5 !px-3.5 rounded-xl font-semibold flex-1 flex items-center justify-center gap-1.5"
                >
                  <span className="text-sm" aria-hidden="true">🐼</span>
                  <span>Đăng nhập</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
