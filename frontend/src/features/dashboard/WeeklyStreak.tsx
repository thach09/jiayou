import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Flame, Minus, Snowflake, Sun, LockKeyhole } from 'lucide-react';
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
    // An older GET must never overwrite the mutation's confirmed balance.
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
  if (!user)
    return (
      <section
        className="dashboard-card dashboard-streak"
        aria-label="Chuỗi học hằng tuần"
      >
        <div className="streak-counter">
          <Flame aria-hidden="true" />
          <strong>Chuỗi học</strong>
        </div>
        <p className="dashboard-subtle flex-1">
          Mỗi ngày học một chút. Đăng nhập để bắt đầu và lưu chuỗi của bạn.
        </p>
        <button className="dashboard-action primary" onClick={requireLogin}>
          Đăng nhập
        </button>
      </section>
    );
  if (!status)
    return (
      <section className="dashboard-card" aria-label="Chuỗi học hằng tuần">
        <p role="status" className="dashboard-subtle">
          {error || 'Đang tải chuỗi học…'}
        </p>
        {error && (
          <button className="dashboard-action mt-3" onClick={() => void load()}>
            Thử lại
          </button>
        )}
      </section>
    );
  return (
    <section
      className="dashboard-card dashboard-streak"
      aria-label="Chuỗi học hằng tuần"
    >
      <div className="streak-counter">
        <Flame
          aria-hidden="true"
          className={
            status.currentStreak > 0 && status.state !== 'FROZEN_PENDING'
              ? 'streak-flame'
              : ''
          }
        />
        <div>
          <strong>{status.displayStreak} ngày</strong>
          <p className="dashboard-subtle">
            {status.state === 'FROZEN_PENDING'
              ? 'Đang tạm dừng'
              : status.state === 'RESTORED'
                ? 'Chuỗi được bảo vệ'
                : 'Chuỗi học của bạn'}
          </p>
        </div>
      </div>
      <ol
        className="streak-week"
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
              <span>{weekdays[index]}</span>
              <Icon aria-hidden="true" />
            </li>
          );
        })}
      </ol>
      <div className="streak-notice">
        <div>
          <p className="text-sm">
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
          <p className="dashboard-subtle mt-1">
            Còn {status.remainingRestorations}/{status.monthlyLimit} lượt khôi
            phục trong tháng · Giờ Việt Nam
          </p>
        </div>
        {status.canRestore && (
          <button
            className="dashboard-action primary shrink-0"
            disabled={busy}
            onClick={() => void restore()}
          >
            {busy ? 'Đang khôi phục…' : 'Khôi phục streak'}
          </button>
        )}
      </div>
      {(notice || error) && (
        <div className="w-full text-sm" role="status">
          {error || notice}
          {error && (
            <button className="ml-3 underline" onClick={() => void load()}>
              Tải lại trạng thái
            </button>
          )}
        </div>
      )}
    </section>
  );
}
