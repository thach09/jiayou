import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../app/useAuth';
import { useRequestScope } from '../../lib/hooks/useRequestScope';
import { progressApi } from '../progress/api';
import { flashcardApi } from '../flashcard/api';
import type { HeatmapDay } from '../progress/types';
const TRACKER_DAYS = 24 * 7;
const CHART_DAYS = 30;
const INTENSITY = [0.06, 0.22, 0.44, 0.66, 0.9];

const formatNumber = (value: number) => value.toLocaleString('vi-VN');

const toLocalDate = (isoDate: unknown): Date => {
  if (!isoDate) return new Date();
  if (Array.isArray(isoDate)) {
    const [year, month, day] = isoDate;
    return new Date(
      Number(year) || 2026,
      (Number(month) || 1) - 1,
      Number(day) || 1,
    );
  }
  if (typeof isoDate === 'string') {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1);
  }
  if (isoDate instanceof Date) return isoDate;
  return new Date();
};

/** 0 = Monday ... 6 = Sunday (heatmap columns run Mon -> Sun) */
const mondayFirstIndex = (date: Date) => (date.getDay() + 6) % 7;

const Caption: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-38">
    {text}
  </div>
);

const StatRow: React.FC<{ label: string; value: number | null }> = ({
  label,
  value,
}) => (
  <div className="flex items-baseline justify-between gap-4 py-3">
    <span className="text-[13px] text-fg-60">{label}</span>
    <b className="text-base font-semibold tabular-nums">
      {value === null ? '—' : formatNumber(value)}
    </b>
  </div>
);

/** Tracker: per-day ink density - the more you study, the brighter the cell */
const Tracker: React.FC<{ days: HeatmapDay[] }> = ({ days }) => {
  const cells = useMemo<(HeatmapDay | null)[]>(() => {
    if (!days || days.length === 0 || !days[0]) {
      return Array.from({ length: TRACKER_DAYS }, () => null);
    }
    const pad = mondayFirstIndex(toLocalDate(days[0].date));
    return [...Array.from({ length: pad }, () => null), ...days];
  }, [days]);

  const level = useMemo(() => {
    const validDays = Array.isArray(days) ? days : [];
    const max = Math.max(1, ...validDays.map((day) => day?.itemCount || 0));
    return (count: number) =>
      count <= 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));
  }, [days]);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-6">
        <Caption text="Hoạt động" />
        <div className="inline-flex items-center gap-1.5 text-[10.5px] text-fg-38">
          ít
          {INTENSITY.map((opacity) => (
            <i
              key={opacity}
              className="inline-block h-2 w-2 bg-fg"
              style={{ opacity }}
            />
          ))}
          nhiều
        </div>
      </div>
      <div className="mt-[22px] flex gap-3">
        <div
          aria-hidden="true"
          className="grid grid-rows-[repeat(7,minmax(0,1fr))] gap-[3px] text-[9px] leading-none text-fg-38"
        >
          <span className="self-center" style={{ gridRow: 1 }}>
            T2
          </span>
          <span className="self-center" style={{ gridRow: 3 }}>
            T4
          </span>
          <span className="self-center" style={{ gridRow: 5 }}>
            T6
          </span>
        </div>
        <div
          aria-hidden="true"
          className="grid min-w-0 flex-1 auto-cols-fr grid-flow-col grid-rows-[repeat(7,minmax(0,1fr))] gap-[3px]"
        >
          {cells.map((cell, index) => (
            <i
              key={index}
              className={`block aspect-square w-full bg-fg ${cell?.restored ? 'protected-heat-cell' : ''}`}
              title={
                cell
                  ? `${cell.date}: ${cell.itemCount} lượt học${cell.restored ? ' · Ngày bảo vệ chuỗi' : ''}`
                  : undefined
              }
              style={{ opacity: INTENSITY[cell ? level(cell.itemCount) : 0] }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const WeekStats: React.FC<{
  items: number | null;
  correct: number | null;
  learned: number | null;
}> = ({ items, correct, learned }) => (
  <div className="flex h-full flex-col">
    <Caption text="7 ngày gần nhất" />
    <div className="mt-[22px] flex flex-1 flex-col justify-between">
      <StatRow label="Lượt học" value={items} />
      <StatRow label="Trả lời đúng" value={correct} />
      <StatRow label="Thẻ đã ôn nhớ (tổng)" value={learned} />
    </div>
  </div>
);

/** 30-day ink bar chart - today is the brightest, the last 7 days are brighter than the rest */
const ActivityChart: React.FC<{
  days: HeatmapDay[];
  metric: 'itemCount' | 'correctCount';
  label: string;
}> = ({ days, metric, label }) => {
  const values = useMemo(
    () => (Array.isArray(days) ? days.map((day) => day?.[metric] || 0) : []),
    [days, metric],
  );
  const max = Math.max(1, ...values);
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-6">
        <Caption text={label} />
        <div className="text-[10.5px] text-fg-38">
          {values.length === 0 ? '—' : `${formatNumber(total)} · 30 ngày`}
        </div>
      </div>
      <div className="mt-[22px] flex h-[88px] items-end justify-between border-b border-rule">
        {values.map((value, index) => {
          const opacity =
            index === values.length - 1
              ? 'opacity-[0.95]'
              : index >= values.length - 7
                ? 'opacity-[0.62]'
                : 'opacity-[0.38]';
          const height =
            value <= 0
              ? '2px'
              : `${Math.max(6, Math.round((value / max) * 100))}%`;
          return (
            <i
              key={index}
              aria-hidden="true"
              className={`block w-[min(12px,3%)] bg-fg ${opacity}`}
              style={{ height }}
            />
          );
        })}
      </div>
    </div>
  );
};

export function LearningActivityDetails() {
  const { user } = useAuth();
  const owner = user?.userId;
  const { run } = useRequestScope(owner);
  const [days, setDays] = useState<HeatmapDay[] | null>(null),
    [learned, setLearned] = useState<number | null>(null),
    [error, setError] = useState('');
  const load = useCallback(async () => {
    if (owner === undefined) return;
    const res = await run('activity-details', (signal) =>
      Promise.all([
        progressApi.heatmap(TRACKER_DAYS, { signal }),
        flashcardApi.stats({ signal }),
      ]),
    );
    if (!res) return;
    if (res[0].success && Array.isArray(res[0].data)) {
      setDays(res[0].data);
      setError('');
      setLearned(
        res[1].success && res[1].data ? res[1].data.learnedWords : null,
      );
    } else setError('Chưa tải được hoạt động học.');
  }, [owner, run]);
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch owner-scoped activity only when this disclosure mounts.
    void load();
  }, [load]);
  if (error)
    return (
      <p role="status" className="dashboard-subtle mt-4">
        {error}{' '}
        <button className="underline" onClick={() => void load()}>
          Thử lại
        </button>
      </p>
    );
  if (!days)
    return (
      <p role="status" className="dashboard-subtle mt-4">
        Đang tải hoạt động…
      </p>
    );
  const recent = days.slice(-7),
    chart = days.slice(-CHART_DAYS);
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <section className="min-w-0">
        <Tracker days={days} />
        <p className="dashboard-subtle mt-4">
          Nét đứt: ngày bảo vệ chuỗi, không cộng hoạt động học hay EXP.
        </p>
      </section>
      <WeekStats
        items={recent.reduce((n, d) => n + d.itemCount, 0)}
        correct={recent.reduce((n, d) => n + d.correctCount, 0)}
        learned={learned}
      />
      <ActivityChart days={chart} metric="itemCount" label="Lượt học" />
      <ActivityChart days={chart} metric="correctCount" label="Trả lời đúng" />
    </div>
  );
}
