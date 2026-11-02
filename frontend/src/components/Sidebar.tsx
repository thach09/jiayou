import { useEffect, useRef } from 'react';
import {
  BookOpen,
  ChevronLeft,
  Home,
  Layers,
  Languages,
  ListChecks,
  PencilRuler,
  Shield,
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
const stations = [
  ['/', 'Hôm nay', Home],
  ['/pinyin', 'Pinyin', Languages],
  ['/hanzi', 'Chữ Hán', PencilRuler],
  ['/vocabulary', 'Từ vựng', BookOpen],
  ['/dictionary', 'Từ điển', BookOpen],
  ['/grammar', 'Ngữ pháp', Layers],
  ['/exam', 'Luyện tập', ListChecks],
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
      className={`app-sidebar fixed inset-y-0 left-0 z-20 flex w-[216px] flex-col overflow-visible px-4 pb-6 pt-7 transition-transform duration-150 max-[900px]:z-[100] max-[900px]:w-[min(280px,82vw)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
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
          className="absolute -right-6 top-8 z-40 flex h-11 w-6 items-center justify-center border border-l-0 border-rule bg-card text-fg-60"
        >
          <ChevronLeft size={14} className={isOpen ? '' : 'rotate-180'} />
        </button>
      )}
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        inert={!isOpen ? true : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <Link to="/" aria-label="Jiayou — Trang chủ" onClick={onNavigate}>
            <BrandLogo />
          </Link>
          {isOverlay && onClose && (
            <button
              ref={close}
              onClick={onClose}
              aria-label="Đóng thanh điều hướng"
              className="flex h-11 w-11 shrink-0 items-center justify-center text-fg-60"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <nav className="mt-9 flex flex-col gap-1.5" aria-label="Các mục chính">
          {[
            ...stations,
            ...(user?.role === 'ROLE_ADMIN'
              ? [['/admin', 'Quản trị', Shield] as const]
              : []),
          ].map(([to, label, Icon]) => (
            <div
              key={to}
              className={to === '/toi' ? 'mt-3 border-t border-rule pt-3' : ''}
            >
              <NavLink
                to={to}
                end={to === '/'}
                onClick={onNavigate}
                className="app-nav-link"
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 pt-6">
          {!user && onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="dashboard-action text-sm"
            >
              Đăng nhập
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
