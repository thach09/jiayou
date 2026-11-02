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
          className="absolute -right-6 top-7 z-40 flex h-10 w-6 items-center justify-center rounded-r-md border border-l-0 border-[rgba(255,180,140,0.18)] bg-[#1E1718] text-[#CBBBAF] hover:text-[#F7F0E8] hover:bg-[#251D1F] transition-colors"
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#CBBBAF] hover:text-[#F7F0E8] hover:bg-white/[0.05]"
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
                      ? 'bg-gradient-to-r from-[rgba(255,141,115,0.20)] to-[rgba(255,141,115,0.06)] border border-[rgba(255,141,115,0.38)] text-[#F7F0E8] font-medium shadow-[0_0_14px_rgba(255,141,115,0.15)]'
                      : 'text-[#CBBBAF] hover:text-[#F7F0E8] hover:bg-white/[0.04] border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? 'text-[#FF8D73]' : 'text-[#CBBBAF]'
                      }`}
                    />
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            </div>
          ))}
        </nav>

        {/* Bottom account block matching approved reference design */}
        <div className="mt-auto pt-4 border-t border-[rgba(255,180,140,0.14)] flex flex-col gap-2.5">
          {user ? (
            <Link
              to="/toi"
              onClick={onNavigate}
              aria-label="Tài khoản cá nhân"
              className="flex items-center justify-between gap-2.5 p-2 rounded-xl border border-[rgba(255,180,140,0.18)] bg-[rgba(34,25,27,0.92)] hover:border-[rgba(255,180,140,0.35)] hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/40 text-base border border-[rgba(255,180,140,0.18)]">
                  🐼
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#F7F0E8] truncate leading-tight">
                    Tài khoản
                  </p>
                  <p className="text-[11px] text-[#CBBBAF] truncate">
                    {user.fullName || 'Người học'}
                  </p>
                </div>
              </div>
              <ChevronRight size={14} className="text-[#CBBBAF] group-hover:text-[#F7F0E8] group-hover:translate-x-0.5 transition-all shrink-0" />
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

          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-[#9E8F86]">Chế độ màu</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
