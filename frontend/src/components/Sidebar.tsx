import { useEffect, useRef } from 'react';
import type { ElementType } from 'react';
import {
  BookOpen,
  ChevronLeft,
  Home,
  Layers,
  Shield,
  Target,
  UserRound,
  X,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import type { AuthResponse } from '../lib/api/types';
import { ThemeToggle } from './ThemeToggle';
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
      {/* 宀 */}
      <path d="M12 3V5.5" />
      <path d="M4.5 8H19.5" />
      <path d="M5.5 8.5V11" />
      <path d="M18.5 8.5V11" />
      {/* 子 */}
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
  ['/toi', 'Tôi', UserRound],
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
      className={`app-sidebar fixed inset-y-0 left-0 z-20 flex w-[228px] flex-col overflow-visible px-4 pb-6 pt-6 transition-transform duration-150 max-[900px]:z-[100] max-[900px]:w-[min(280px,82vw)] ${
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
          className="absolute -right-6 top-7 z-40 flex h-10 w-6 items-center justify-center rounded-r-md border border-l-0 border-[#49403D] bg-[#24201F] text-[#B9B0AA] hover:text-[#F5F0E9] hover:bg-[#2C2725] transition-colors"
        >
          <ChevronLeft size={14} className={isOpen ? '' : 'rotate-180'} />
        </button>
      )}

      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        inert={!isOpen ? true : undefined}
      >
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#B9B0AA] hover:text-[#F5F0E9] hover:bg-white/[0.05]"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav
          className="mt-7 flex flex-col gap-1.5"
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
                  `app-nav-link flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[14.5px] transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-[rgba(255,140,116,0.18)] to-[rgba(255,140,116,0.06)] border border-[rgba(255,140,116,0.35)] text-[#F5F0E9] font-medium shadow-[0_0_12px_rgba(255,140,116,0.12)]'
                      : 'text-[#B9B0AA] hover:text-[#F5F0E9] hover:bg-white/[0.04] border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? 'text-[#FF8C74]' : 'text-[#B9B0AA]'
                      }`}
                    />
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            </div>
          ))}
        </nav>

        {/* Bottom controls: clean and integrated */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#49403D]/40 pt-4 px-1">
          {!user && onOpenAuthModal ? (
            <button
              onClick={onOpenAuthModal}
              className="dashboard-action primary text-xs !min-h-[36px] !py-1.5 !px-3.5 rounded-lg"
            >
              Đăng nhập
            </button>
          ) : (
            <div />
          )}
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
