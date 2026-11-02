import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Flame,
  Minus,
  Snowflake,
  Sun,
  LockKeyhole,
} from 'lucide-react';
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

  if (!user) {
    return (
      <section
        className="dashboard-card dashboard-streak !p-5"
        aria-label="Chuỗi học hằng tuần"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF8C74]/20 to-[#E9BC78]/10 border border-[#FF8C74]/30 shadow-[0_0_14px_rgba(255,140,116,0.25)]">
              <Flame className="w-6 h-6 text-[#FF8C74] streak-flame" aria-hidden="true" />
            </div>
            <div>
              <strong className="text-lg font-bold text-[#F5F0E9]">Chuỗi học</strong>
              <p className="dashboard-subtle text-xs mt-0.5">
                Mỗi ngày học một chút. Đăng nhập để bắt đầu và lưu chuỗi của bạn.
              </p>
            </div>
          </div>

          {/* 7 Days Preview Cells */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekdays.map((day, idx) => (
                <div
                  key={day}
                  className="flex h-12 w-10 sm:w-11 flex-col items-center justify-center rounded-lg border border-[#49403D]/60 bg-white/[0.02] text-[11px] text-[#B9B0AA]"
                  title={`Thứ ${idx + 2 <= 7 ? idx + 2 : 'Chủ nhật'}`}
                >
                  <span className="font-medium text-[11px]">{day}</span>
                  <Minus size={13} className="text-[#82736B] mt-0.5" />
                </div>
              ))}
            </div>
            <button
              className="dashboard-action primary text-xs !min-h-[40px] px-4 font-semibold shrink-0 ml-auto sm:ml-2"
              onClick={requireLogin}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!status) {
    return (
      <section className="dashboard-card !p-5" aria-label="Chuỗi học hằng tuần">
        <p role="status" className="dashboard-subtle text-sm">
          {error || 'Đang tải chuỗi học…'}
        </p>
        {error && (
          <button
            className="dashboard-action text-xs mt-2.5"
            onClick={() => void load()}
          >
            Thử lại
          </button>
        )}
      </section>
    );
  }

  return (
    <section
      className="dashboard-card dashboard-streak !p-5"
      aria-label="Chuỗi học hằng tuần"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        {/* Streak Flame Counter */}
        <div className="streak-counter flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF8C74]/25 to-[#E9BC78]/15 border border-[#FF8C74]/35 shadow-[0_0_16px_rgba(255,140,116,0.3)]">
            <Flame
              aria-hidden="true"
              className={`w-7 h-7 text-[#FF8C74] ${
                status.currentStreak > 0 && status.state !== 'FROZEN_PENDING'
                  ? 'streak-flame'
                  : ''
              }`}
            />
          </div>
          <div>
            <strong className="text-2xl font-bold tracking-tight text-[#F5F0E9]">
              {status.displayStreak} ngày
            </strong>
            <p className="dashboard-subtle text-xs mt-0.5">
              {status.state === 'FROZEN_PENDING'
                ? 'Đang tạm dừng'
                : status.state === 'RESTORED'
                  ? 'Chuỗi được bảo vệ'
                  : 'Chuỗi học của bạn'}
            </p>
          </div>
        </div>

        {/* 7 Days Week List */}
        <ol
          className="streak-week flex-1"
          aria-label={`Tuần bắt đầu ${status.weekStart}, ${status.zone}`}
        >
          {status.days.map((day, index) => {
            const Icon =
              day.state === 'RESTORED'
                ? Snowflake
                : day.qualified
                  ? Check
                  : day.state === 'TODAY_PENDING'
                    ? Sun
                    : day.state === 'FUTURE'
                      ? LockKeyhole
                      : Minus;
            const label = `${weekdays[index]}, ${day.date}: ${labels[day.state]}`;
            return (
              <li
                key={day.date}
                className="streak-day"
                data-state={day.state}
                aria-label={label}
                title={label}
                aria-current={day.date === status.today ? 'date' : undefined}
              >
                <span className="font-medium text-[11px]">{weekdays[index]}</span>
                <Icon
                  size={15}
                  aria-hidden="true"
                  className={
                    day.qualified
                      ? 'text-[#FF8C74]'
                      : day.state === 'RESTORED'
                        ? 'text-[#7DDAB0]'
                        : day.state === 'TODAY_PENDING'
                          ? 'text-[#E9BC78]'
                          : 'text-[#82736B]'
                  }
                />
              </li>
            );
          })}
        </ol>
      </div>

      {/* Context info and optional restoration button */}
      <div className="streak-notice mt-3 pt-3 border-t border-[#49403D]/40 flex flex-wrap items-center justify-between gap-3 w-full text-xs">
        <div>
          <p className="text-[#F5F0E9]/90 leading-relaxed">
            {status.canRestore
              ? `Bạn đã bỏ lỡ ${status.requiredRestorations} ngày. Khôi phục trọn khoảng nghỉ để nối lại chuỗi.`
              : status.reason === 'INSUFFICIENT_ALLOWANCE'
                ? `Cần ${status.requiredRestorations} lượt để nối chuỗi, nhưng tháng này không còn đủ. Bạn có thể bắt đầu chuỗi mới.`
                : status.reason === 'WINDOW_EXPIRED'
                  ? 'Khoảng nghỉ đã quá 7 ngày. Hãy bắt đầu chuỗi mới từ hôm nay.'
                  : status.todayQualified
                    ? 'Hôm nay bạn đã học đủ điều kiện. Hẹn gặp lại ngày mai!'
                    : 'Hôm nay: ôn 10 thẻ SRS, nộp 1 bài luyện hoặc làm 10 câu ngữ pháp.'}
          </p>
          <p className="dashboard-subtle text-[11.5px] mt-0.5">
            Còn {status.remainingRestorations}/{status.monthlyLimit} lượt khôi
            phục trong tháng · Giờ Việt Nam
          </p>
        </div>
        {status.canRestore && (
          <button
            className="dashboard-action primary shrink-0 text-xs !min-h-[38px] px-3.5 font-semibold"
            disabled={busy}
            onClick={() => void restore()}
          >
            {busy ? 'Đang khôi phục…' : 'Khôi phục streak'}
          </button>
        )}
      </div>

      {(notice || error) && (
        <div className="w-full text-xs mt-2 text-[#FF9B86]" role="status">
          {error || notice}
          {error && (
            <button className="ml-3 underline text-[#F5F0E9]" onClick={() => void load()}>
              Tải lại trạng thái
            </button>
          )}
        </div>
      )}
    </section>
  );
}
