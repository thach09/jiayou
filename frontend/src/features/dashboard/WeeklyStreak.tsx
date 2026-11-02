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
        className="dashboard-card dashboard-streak !py-3 !px-4 sm:!px-5"
        aria-label="Chuỗi học hằng tuần"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF8D73]/20 to-[#E8B15C]/10 border border-[#FF8D73]/30 shadow-[0_0_12px_rgba(255,141,115,0.25)]">
              <Flame className="w-5 h-5 text-[#FF8D73] streak-flame" aria-hidden="true" />
            </div>
            <div>
              <strong className="text-base font-bold text-[#F7F0E8]">Chuỗi học</strong>
              <p className="dashboard-subtle text-xs">
                Mỗi ngày học một chút. Đăng nhập để bắt đầu và lưu chuỗi của bạn.
              </p>
            </div>
          </div>

          {/* 7 Days Preview Cells without weekday text */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {weekdays.map((day, idx) => (
                <div
                  key={day}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-[#49403D]/60 bg-white/[0.02] text-[#82736B]"
                  title={`Thứ ${idx + 2 <= 7 ? idx + 2 : 'Chủ nhật'}`}
                >
                  <Minus size={13} className="text-[#82736B]" />
                </div>
              ))}
            </div>
            <button
              className="dashboard-action primary text-xs !min-h-[36px] px-3.5 font-semibold shrink-0 ml-1"
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
      <section className="dashboard-card !py-3 !px-4 sm:!px-5" aria-label="Chuỗi học hằng tuần">
        <p role="status" className="dashboard-subtle text-sm">
          {error || 'Đang tải chuỗi học…'}
        </p>
        {error && (
          <button
            className="dashboard-action text-xs mt-2"
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
      className="dashboard-card dashboard-streak !py-3 !px-4 sm:!px-5"
      aria-label="Chuỗi học hằng tuần"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        {/* Streak Flame Counter */}
        <div className="streak-counter flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF8D73]/25 to-[#E8B15C]/15 border border-[#FF8D73]/35 shadow-[0_0_14px_rgba(255,141,115,0.3)]">
            <Flame
              aria-hidden="true"
              className={`w-5 h-5 text-[#FF8D73] ${
                status.currentStreak > 0 && status.state !== 'FROZEN_PENDING'
                  ? 'streak-flame'
                  : ''
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-xl font-bold tracking-tight text-[#F7F0E8]">
                {status.displayStreak} ngày
              </strong>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FF8D73]/12 border border-[#FF8D73]/25 text-[#FF8D73] font-medium">
                {status.state === 'FROZEN_PENDING'
                  ? 'Đang tạm dừng'
                  : status.state === 'RESTORED'
                    ? 'Chuỗi được bảo vệ'
                    : 'Chuỗi học của bạn'}
              </span>
            </div>
            <p className="dashboard-subtle text-[11px] mt-0.5">
              Còn {status.remainingRestorations}/{status.monthlyLimit} lượt khôi phục trong tháng · Giờ Việt Nam
            </p>
          </div>
        </div>

        {/* 7 Days Week List - Sleek gamification segment strip without visible weekday text */}
        <div className="flex items-center gap-3 flex-wrap ml-auto">
          <ol
            className="streak-week flex items-center gap-1.5 sm:gap-2"
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
                  className="streak-segment flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border transition-all"
                  data-state={day.state}
                  aria-label={label}
                  title={label}
                  aria-current={day.date === status.today ? 'date' : undefined}
                >
                  <Icon
                    size={14}
                    aria-hidden="true"
                    className={
                      day.qualified
                        ? 'text-[#FF8D73]'
                        : day.state === 'RESTORED'
                          ? 'text-[#67D2A0]'
                          : day.state === 'TODAY_PENDING'
                            ? 'text-[#E8B15C]'
                            : day.state === 'FUTURE'
                              ? 'text-[#655953]'
                              : 'text-[#82736B]'
                    }
                  />
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Context info and optional restoration button */}
      <div className="streak-notice mt-2.5 pt-2.5 border-t border-[#49403D]/30 flex flex-wrap items-center justify-between gap-2.5 w-full text-xs">
        <div>
          <p className="text-[#F7F0E8]/90 leading-relaxed text-[12px]">
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
        </div>
        {status.canRestore && (
          <button
            className="dashboard-action primary shrink-0 text-xs !min-h-[34px] px-3 font-semibold rounded-lg"
            disabled={busy}
            onClick={() => void restore()}
          >
            {busy ? 'Đang khôi phục…' : 'Khôi phục streak'}
          </button>
        )}
      </div>

      {(notice || error) && (
        <div className="w-full text-xs mt-1.5 text-[#FF9B7A]" role="status">
          {error || notice}
          {error && (
            <button className="ml-3 underline text-[#F7F0E8]" onClick={() => void load()}>
              Tải lại trạng thái
            </button>
          )}
        </div>
      )}
    </section>
  );
}
