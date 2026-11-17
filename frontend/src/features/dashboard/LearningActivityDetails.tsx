import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../app/useAuth';
import { useRequestScope } from '../../lib/hooks/useRequestScope';
import { progressApi } from '../progress/api';
import { flashcardApi } from '../flashcard/api';
import type { HeatmapDay } from '../progress/types';

/** 1 full year = 365 days (fits backend @Max(366) validation) */
const TRACKER_DAYS = 365;

const CELL_LEVELS = [
  'bg-heat-empty border border-heat-border/40',
  'bg-cinnabar/22 border border-cinnabar/32',
  'bg-cinnabar/48 border border-cinnabar/58',
  'bg-cinnabar/74 border border-cinnabar/84',
  'bg-cinnabar border border-heat-strong shadow-[0_0_6px_rgba(255,141,115,0.35)]',
];

const MONTH_NAMES = [
  'Thg 1',
  'Thg 2',
  'Thg 3',
  'Thg 4',
  'Thg 5',
  'Thg 6',
  'Thg 7',
  'Thg 8',
  'Thg 9',
  'Thg 10',
  'Thg 11',
  'Thg 12',
];

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
  <div className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-fg-60">
    {text}
  </div>
);

const StatRow: React.FC<{ label: string; value: number | null }> = ({
  label,
  value,
}) => (
  <div className="flex items-baseline justify-between gap-4 py-1.5">
    <span className="text-[12.5px] text-fg-60">{label}</span>
    <b className="text-[15px] font-semibold tabular-nums text-fg">
      {value === null ? '—' : formatNumber(value)}
    </b>
  </div>
);

/** Tracker: 1-Year GitHub-Style Contribution Heatmap */
const Tracker: React.FC<{ days: HeatmapDay[] }> = ({ days }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest days (rightmost) on mobile / tablet
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [days]);

  // Transform 365 days into 52-53 weekly columns (Monday -> Sunday)
  const { weeks, monthLabels, totalYearItems } = useMemo(() => {
    if (!days || days.length === 0 || !days[0]) {
      return { weeks: [], monthLabels: [], totalYearItems: 0 };
    }

    const firstDate = toLocalDate(days[0].date);
    const startPad = mondayFirstIndex(firstDate);

    const weekList: (HeatmapDay | null)[][] = [];
    let currentWeek: (HeatmapDay | null)[] = [];

    // Pad beginning of first week so column starts on Monday
    for (let p = 0; p < startPad; p++) {
      currentWeek.push(null);
    }

    let total = 0;
    for (const d of days) {
      currentWeek.push(d);
      total += d?.itemCount || 0;
      if (currentWeek.length === 7) {
        weekList.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weekList.push(currentWeek);
    }

    // Determine month labels aligned with week columns
    const labels: { colIdx: number; label: string }[] = [];
    let lastMonth = -1;

    weekList.forEach((week, colIdx) => {
      const firstValid = week.find((item) => item !== null);
      if (!firstValid) return;
      const m = toLocalDate(firstValid.date).getMonth();
      if (m !== lastMonth) {
        // Omit a short partial starting month rather than overlap the next label.
        if (labels.length > 0 && colIdx - labels[labels.length - 1].colIdx < 3) {
          labels.pop();
        }
        labels.push({ colIdx, label: MONTH_NAMES[m] });
        lastMonth = m;
      }
    });

    return { weeks: weekList, monthLabels: labels, totalYearItems: total };
  }, [days]);

  const level = useMemo(() => {
    const validDays = Array.isArray(days) ? days : [];
    const max = Math.max(1, ...validDays.map((day) => day?.itemCount || 0));
    return (count: number) =>
      count <= 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));
  }, [days]);

  return (
    <div>
      {/* Header bar: Year summary on left, legend on right */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-fg">
            {formatNumber(totalYearItems)} lượt học trong năm qua
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[10.5px] text-fg-60">
          <span>Ít</span>
          {CELL_LEVELS.map((cls, idx) => (
            <i
              key={idx}
              className={`inline-block h-2.5 w-2.5 rounded-[2px] ${cls}`}
              aria-hidden="true"
            />
          ))}
          <span>Nhiều</span>
        </div>
      </div>

      {/* GitHub-Style 53-Week Unified Grid */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-2 [scrollbar-width:thin] select-none"
      >
        <div
          className="grid min-w-[700px] w-full gap-[3px] items-center"
          style={{
            gridTemplateColumns: `22px repeat(${weeks.length || 53}, minmax(0, 1fr))`,
            gridTemplateRows: `22px repeat(7, auto)`,
          }}
        >
          {/* Row 1: Month labels */}
          {monthLabels.map(({ colIdx, label }) => (
            <span
              key={colIdx}
              style={{ gridColumn: colIdx + 2, gridRow: 1 }}
              className="text-[11px] font-normal text-fg-60 whitespace-nowrap self-end pb-0.5 leading-none"
            >
              {label}
            </span>
          ))}

          {/* Column 1: Alternating day labels (T2 = Mon, T4 = Wed, T6 = Fri) */}
          <span
            style={{ gridColumn: 1, gridRow: 2 }}
            className="text-[10px] text-fg-60 pr-1 text-right self-center leading-none"
            aria-hidden="true"
          >
            T2
          </span>
          <span
            style={{ gridColumn: 1, gridRow: 4 }}
            className="text-[10px] text-fg-60 pr-1 text-right self-center leading-none"
            aria-hidden="true"
          >
            T4
          </span>
          <span
            style={{ gridColumn: 1, gridRow: 6 }}
            className="text-[10px] text-fg-60 pr-1 text-right self-center leading-none"
            aria-hidden="true"
          >
            T6
          </span>

          {/* Rows 2-8, Columns 2-(weeks+1): 365 Days Cells */}
          {weeks.map((week, wIdx) =>
            week.map((cell, dIdx) => {
              if (!cell) {
                return (
                  <div
                    key={`${wIdx}-${dIdx}`}
                    style={{ gridColumn: wIdx + 2, gridRow: dIdx + 2 }}
                    className="aspect-square w-full"
                  />
                );
              }
              const lvl = level(cell.itemCount);
              const isProtected = cell.restored;
              return (
                <i
                  key={`${wIdx}-${dIdx}`}
                  style={{ gridColumn: wIdx + 2, gridRow: dIdx + 2 }}
                  className={`block aspect-square w-full rounded-[2px] transition-transform hover:scale-150 hover:z-20 cursor-pointer ${
                    isProtected
                      ? 'border border-dashed border-gold-soft bg-gold-soft/25'
                      : CELL_LEVELS[lvl]
                  }`}
                  title={`${cell.date}: ${cell.itemCount} lượt học${
                    isProtected ? ' · Ngày bảo vệ chuỗi' : ''
                  }`}
                />
              );
            }),
          )}
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
  <div className="flex h-full flex-col justify-between">
    <Caption text="7 ngày gần nhất" />
    <div className="mt-2.5 flex flex-1 flex-col justify-between divide-y divide-rule-muted/40">
      <StatRow label="Lượt học" value={items} />
      <StatRow label="Trả lời đúng" value={correct} />
      <StatRow label="Từ đã ôn nhớ (tổng)" value={learned} />
    </div>
  </div>
);

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
    // oxlint-disable-next-line react/set-state-in-effect -- fetch owner-scoped activity only when mounted.
    void load();
  }, [load]);

  if (error)
    return (
      <p role="status" className="dashboard-subtle text-xs">
        {error}{' '}
        <button className="underline text-cinnabar" onClick={() => void load()}>
          Thử lại
        </button>
      </p>
    );

  if (!days)
    return (
      <p role="status" className="dashboard-subtle text-xs">
        Đang tải hoạt động…
      </p>
    );

  const recent = days.slice(-7);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px] items-stretch">
      <section className="min-w-0" aria-label="Bản đồ nhiệt hoạt động học 1 năm">
        <Tracker days={days} />
      </section>
      <section
        className="min-w-0 xl:border-l xl:border-rule-muted/40 xl:pl-6"
        aria-label="Thống kê 7 ngày gần nhất"
      >
        <WeekStats
          items={recent.reduce((n, d) => n + d.itemCount, 0)}
          correct={recent.reduce((n, d) => n + d.correctCount, 0)}
          learned={learned}
        />
      </section>
    </div>
  );
}
