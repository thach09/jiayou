import { useEffect, useState } from 'react';
import { useAuth } from '../../app/useAuth';
import { useRequestScope } from '../../lib/hooks/useRequestScope';
import { getMyProfile } from './api';
import type { UserProfileResponse } from '../../lib/api/types';
import { Shield, Calendar, KeyRound, LogOut } from 'lucide-react';

const isMyProfile = (
  value: UserProfileResponse | null | undefined,
  owner: number,
): value is UserProfileResponse =>
  Boolean(
    value &&
      value.id === owner &&
      typeof value.fullName === 'string' &&
      typeof value.email === 'string' &&
      typeof value.role === 'string',
  );

export function AccountView() {
  const { user } = useAuth();
  return <AccountSession key={user?.userId ?? 'guest'} />;
}

function AccountSession() {
  const { user, requireLogin, openRegistration, changePassword, logout } =
    useAuth();
  const { run, isActive } = useRequestScope(user?.userId);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState<'logout' | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void run('account.profile', (signal) => getMyProfile(signal))
      .then((res) => {
        if (!active || !res) return;
        setLoading(false);
        if (res.success && isMyProfile(res.data, user.userId)) {
          setProfile(res.data);
          setError('');
        } else {
          setProfile(null);
          setError(res.message || 'Chưa tải được tài khoản. Vui lòng thử lại.');
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          setError('Chưa tải được tài khoản. Vui lòng thử lại.');
        }
      });
    return () => {
      active = false;
    };
  }, [run, user, retry]);

  if (!user) {
    return (
      <section className="max-w-[760px] mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-[28px] font-bold text-fg tracking-tight">
            Tài khoản
          </h1>
          <span className="sr-only">Tôi</span>
        </div>

        <div className="dashboard-card p-6 sm:p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-cinnabar/12 border border-cinnabar/30 text-3xl shadow-[0_0_20px_rgba(255,141,115,0.25)]">
            🐼
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-fg">
              Đăng nhập vào Jiayou
            </h2>
            <p className="text-sm text-fg-60">
              Đăng nhập để lưu tiến độ và quản lý tài khoản của bạn.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              className="dashboard-action primary text-sm !min-h-[42px] px-6 font-semibold"
              onClick={requireLogin}
            >
              Đăng nhập
            </button>
            <button
              className="dashboard-action text-sm !min-h-[42px] px-6 font-medium"
              onClick={openRegistration ?? requireLogin}
            >
              Đăng ký
            </button>
          </div>
        </div>
      </section>
    );
  }

  const initials = profile?.fullName
    ? profile.fullName
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((s) => s[0])
        .join('')
        .toLocaleUpperCase('vi')
    : 'JY';

  const roleLabel =
    profile?.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Học viên';
  const joinedDate =
    profile?.createdAt && !Number.isNaN(Date.parse(profile.createdAt))
      ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
      : 'Chưa có dữ liệu';

  return (
    <section className="max-w-[760px] mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-[28px] font-bold text-fg tracking-tight">
          Tài khoản
        </h1>
        <span className="sr-only">Tôi</span>
      </div>

      {loading && (
        <p role="status" className="dashboard-subtle text-sm animate-pulse">
          Đang tải tài khoản…
        </p>
      )}

      {error && (
        <div className="dashboard-card p-5 border-cinnabar/30 space-y-3">
          <p role="status" className="text-sm text-cinnabar">
            {error}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              className="dashboard-action primary text-xs !min-h-[36px] px-4"
              onClick={() => {
                setLoading(true);
                setError('');
                setRetry((v) => v + 1);
              }}
            >
              Thử lại
            </button>
            <button
              className="dashboard-action text-xs !min-h-[36px] px-4"
              onClick={requireLogin}
            >
              Đăng nhập lại
            </button>
            <button
              className="dashboard-action text-xs !min-h-[36px] px-4 ml-auto"
              disabled={busy !== null}
              onClick={async () => {
                setBusy('logout');
                await logout();
                if (isActive()) setBusy(null);
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {profile && (
        <>
          {/* Profile Hero Card */}
          <div className="dashboard-card p-6 relative overflow-hidden flex flex-wrap items-center gap-5">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cinnabar/25 to-gold-soft/15 border border-cinnabar/35 text-xl font-bold text-fg shadow-[0_0_16px_rgba(255,141,115,0.3)]">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 text-sm bg-black/60 rounded-full px-1 border border-[rgba(255,180,140,0.2)]">
                🐼
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-fg break-words">
                  {profile.fullName}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cinnabar/12 border border-cinnabar/30 text-cinnabar font-medium">
                  {roleLabel}
                </span>
              </div>
              <p className="text-sm text-fg-60 mt-1 break-all">
                {profile.email}
              </p>
              <div className="flex items-center gap-4 text-xs text-fg-subtle mt-2">
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-gold-soft" />
                  <span>
                    Ngày tham gia:{' '}
                    <strong className="text-fg-60 font-normal">
                      {joinedDate}
                    </strong>
                  </span>
                </span>
              </div>
            </div>
          </div>


          {/* Security & Session Management Card */}
          <div className="dashboard-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cinnabar/12 text-cinnabar border border-cinnabar/25">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-fg">
                  Quản lý tài khoản
                </h3>
                <p className="text-xs text-fg-60">
                  Bảo mật mật khẩu và phiên làm việc.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1 border-t border-rule-muted/40">
              <button
                className="dashboard-action text-xs !min-h-[38px] px-4 font-medium flex items-center gap-2"
                disabled={busy !== null}
                onClick={changePassword}
              >
                <KeyRound size={14} className="text-gold-soft" />
                <span>Đổi mật khẩu</span>
              </button>
              <button
                className="dashboard-action text-xs !min-h-[38px] px-4 font-medium text-cinnabar hover:text-cinnabar-hover border-cinnabar/30 hover:border-cinnabar/60 flex items-center gap-2 ml-auto"
                disabled={busy !== null}
                onClick={async () => {
                  setBusy('logout');
                  await logout();
                  if (isActive()) setBusy(null);
                }}
              >
                <LogOut size={14} />
                <span>
                  {busy === 'logout' ? 'Đang đăng xuất…' : 'Đăng xuất'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
