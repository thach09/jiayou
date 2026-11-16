import { useCallback, useEffect, useRef, useState } from 'react';
import { Flame } from 'lucide-react';
import { useAuth } from '../../app/useAuth';
import { useRequestScope } from '../../lib/hooks/useRequestScope';
import { apiRequest } from '../../lib/api/client';
import type { StreakDayState, WeeklyStreak as Status } from './streak';
import { isWeeklyStreak } from './streak';

const labels: Record<StreakDayState, string> = {
  COMPLETED: 'Đã học đủ điều kiện',
  TODAY_COMPLETED: 'Hôm nay đã hoàn thành',
  TODAY_PENDING: 'Hôm nay chưa đủ điều kiện',
  MISSED: 'Chưa hoàn thành',
  RESTORED: 'Đã bảo vệ chuỗi, không phải ngày đã học',
  FUTURE: 'Ngày sắp tới',
};

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function WeeklyStreak() {
  const { user } = useAuth();
  return <StreakSession key={user?.userId ?? 'guest'} />;
}

function StreakSession() {
  const { user, requireLogin } = useAuth();
  const owner = user?.userId;
  const { run, cancel, isActive } = useRequestScope(owner);
  const [status, setStatus] = useState<Status | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  const pending = useRef<{ gap: string; id: string } | null>(null),
    locked = useRef(false);

  const load = useCallback(async () => {
    if (owner === undefined || locked.current) return;
    const res = await run('streak-status', (signal) =>
      apiRequest<Status>('/streak/week', { signal }),
    );
    if (!res) return;
    if (res.success && isWeeklyStreak(res.data)) {
      setStatus(res.data);
      setError('');
    } else setError(res.message || 'Chưa tải được chuỗi học.');
  }, [owner, run]);

  useEffect(() => {
    if (owner === undefined) return;
    // oxlint-disable-next-line react/set-state-in-effect -- synchronize owner-scoped external HTTP state.
    void load();
    const refresh = () => {
      if (!document.hidden && !locked.current) void load();
    };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [owner, load]);

  const restore = async () => {
    if (locked.current || !status?.canRestore || !status.gapToken) return;
    locked.current = true;
    cancel('streak-status');
    setBusy(true);
    setNotice('');
    setError('');
    const gap = status.gapToken;
    if (pending.current?.gap !== gap)
      pending.current = { gap, id: crypto.randomUUID() };
    try {
      const res = await run('streak-restore', (signal) =>
        apiRequest<Status>('/streak/restore', {
          method: 'POST',
          signal,
          body: JSON.stringify({
            requestId: pending.current!.id,
            gapToken: gap,
          }),
        }),
      );
      if (!isActive() || !res) return;
      if (res.success && isWeeklyStreak(res.data)) {
        setStatus(res.data);
        setNotice(
          'Đã khôi phục chuỗi học. Ngày bảo vệ không được tính là hoạt động học.',
        );
        pending.current = null;
      } else {
        setError(
          res.message ||
            'Chưa khôi phục được. Lượt của bạn chỉ thay đổi khi máy chủ xác nhận.',
        );
      }
    } finally {
      locked.current = false;
      if (isActive()) setBusy(false);
    }
  };

  /* Guest minimal presentation */
  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Flame className="w-5 h-5 text-cinnabar streak-flame" aria-hidden="true" />
        <span className="text-xs sm:text-sm font-medium text-fg-60">
          Mỗi ngày học một chút.
        </span>
        <button
          className="dashboard-action primary text-xs !min-h-[32px] !py-1 !px-3 font-semibold rounded-lg ml-1"
          onClick={requireLogin}
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  /* Authenticated loading / error */
  if (!status) {
    return (
      <div className="flex items-center gap-2 text-xs text-fg-60">
        <Flame className="w-4 h-4 text-rule-strong" aria-hidden="true" />
        <span role="status">{error || 'Đang tải chuỗi học…'}</span>
        {error && (
          <button
            className="underline text-cinnabar ml-1 font-medium"
            onClick={() => void load()}
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  /* Interrupted streak state (eligible for restore) */
  if (status.canRestore && status.gapToken) {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 rounded-xl border border-cinnabar/35 bg-gradient-to-r from-[rgba(255,141,115,0.12)] to-[rgba(232,177,92,0.06)] shadow-[0_0_16px_rgba(255,141,115,0.15)] w-full"
        aria-label="Chuỗi học hằng tuần"
      >
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-cinnabar streak-flame shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-base font-semibold tracking-normal text-fg">
                {status.displayStreak} ngày
              </strong>
              <span className="text-xs text-cinnabar font-medium">
                Chuỗi học bị gián đoạn
              </span>
              {status.state === 'FROZEN_PENDING' && (
                <span className="sr-only">Đang tạm dừng</span>
              )}
            </div>
            <p className="text-[11.5px] text-fg-60">
              Còn {status.remainingRestorations}/{status.monthlyLimit} lượt khôi phục trong tháng
            </p>
          </div>
        </div>

        <button
          className="dashboard-action primary text-xs !min-h-[34px] !py-1 !px-3.5 font-semibold rounded-lg shrink-0"
          disabled={busy}
          onClick={() => void restore()}
        >
          {busy ? 'Đang khôi phục…' : 'Khôi phục streak'}
        </button>

        {/* Accessible calendar entries for screen-readers & unit tests */}
        <ol className="sr-only" aria-label={`Tuần bắt đầu ${status.weekStart}, ${status.zone}`}>
          {status.days.map((day, index) => {
            const label = `${weekdays[index]}, ${day.date}: ${labels[day.state]}`;
            return (
              <li
                key={day.date}
                aria-label={label}
                aria-current={day.date === status.today ? 'date' : undefined}
              >
                {label}
              </li>
            );
          })}
        </ol>

        {notice && (
          <p role="status" className="w-full text-xs text-jade pt-1">
            {notice}
          </p>
        )}
        {error && (
          <p role="status" className="w-full text-xs text-cinnabar pt-1">
            {error}
          </p>
        )}
      </div>
    );
  }

  /* Broken streak state with insufficient allowance */
  if (!status.canRestore && status.remainingRestorations === 0 && status.requiredRestorations > 0) {
    return (
      <div className="flex flex-wrap items-center gap-2.5 p-2.5 rounded-xl border border-rule-muted/60 bg-black/25 w-full">
        <Flame className="w-4 h-4 text-rule-strong" aria-hidden="true" />
        <span className="text-xs text-fg-60">
          Chuỗi học đã kết thúc. Lượt khôi phục tháng này không còn đủ để bảo vệ chuỗi.
        </span>
        <ol className="sr-only" aria-label={`Tuần bắt đầu ${status.weekStart}, ${status.zone}`}>
          {status.days.map((day, index) => (
            <li key={day.date} aria-label={`${weekdays[index]}, ${day.date}: ${labels[day.state]}`}>
              {day.date}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  /* Normal Active / Restored State: Genuine Minimal Presentation */
  return (
    <div
      className="flex items-center gap-3"
      aria-label="Chuỗi học hằng tuần"
    >
      <div className="flex items-center gap-2">
        {/* Standalone animated flame with restrained organic flickering & glow */}
        <Flame
          aria-hidden="true"
          className={`w-6 h-6 text-cinnabar shrink-0 ${
            status.currentStreak > 0 ? 'streak-flame' : 'opacity-65'
          }`}
        />
        <strong className="text-xl sm:text-2xl font-semibold tracking-normal text-fg">
          {status.displayStreak} ngày
        </strong>
      </div>

      {notice && (
        <span role="status" className="text-xs text-jade font-medium">
          {notice}
        </span>
      )}

      {/* Accessible calendar entries for screen-readers & unit tests */}
      <span className="sr-only">
        Còn {status.remainingRestorations}/{status.monthlyLimit} lượt khôi phục
      </span>
      <ol className="sr-only" aria-label={`Tuần bắt đầu ${status.weekStart}, ${status.zone}`}>
        {status.days.map((day, index) => {
          const label = `${weekdays[index]}, ${day.date}: ${labels[day.state]}`;
          return (
            <li
              key={day.date}
              aria-label={label}
              aria-current={day.date === status.today ? 'date' : undefined}
            >
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
