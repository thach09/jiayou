import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../app/useAuth';
import { useRequestScope } from '../../lib/hooks/useRequestScope';
import { progressApi } from '../progress/api';
import { flashcardApi } from '../flashcard/api';
import type { HeatmapDay } from '../progress/types';

/** Fetch enough history for any calendar year, including leap years. */
const TRACKER_DAYS = 366;

const CELL_LEVELS = [
  'bg-heat-empty border border-heat-border/40',
  'bg-cinnabar/22 border border-cinnabar/32',
  'bg-cinnabar/48 border border-cinnabar/58',
  'bg-cinnabar/74 border border-cinnabar/84',
  'bg-cinnabar border border-heat-strong shadow-[0_0_6px_rgba(255,141,115,0.35)]',
];

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
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

  // The last date comes from the server's study timezone, not the browser clock.
  const latest = days.at(-1);
  const year = latest ? toLocalDate(latest.date).getFullYear() : null;
  const { weeks, monthLabels, totalYearItems, latestColumn, maxItems } = useMemo(() => {
    if (year === null) {
      return { weeks: [], monthLabels: [], totalYearItems: 0, latestColumn: 0, maxItems: 1 };
    }

    const first = new Date(year, 0, 1);
    const startPad = mondayFirstIndex(first);
    const dayOfYear = (date: Date) =>
      (Date.UTC(year, date.getMonth(), date.getDate()) - Date.UTC(year, 0, 1)) / 86_400_000;
    const daysInYear = dayOfYear(new Date(year, 11, 31)) + 1;
    const slots: (HeatmapDay | null)[] = Array(Math.ceil((startPad + daysInYear) / 7) * 7).fill(null);
    let total = 0;
    let newest = 0;
    let max = 1;
    for (const day of days) {
      const date = toLocalDate(day.date);
      if (date.getFullYear() !== year) continue;
      const index = startPad + dayOfYear(date);
      slots[index] = day;
      total += day.itemCount;
      max = Math.max(max, day.itemCount);
      newest = Math.max(newest, index);
    }
    return {
      weeks: Array.from({ length: slots.length / 7 }, (_, i) => slots.slice(i * 7, i * 7 + 7)),
      monthLabels: MONTH_NAMES.map((label, month) => ({
        label, colIdx: Math.floor((startPad + dayOfYear(new Date(year, month, 1))) / 7),
      })),
      totalYearItems: total,
      latestColumn: Math.floor(newest / 7),
      maxItems: max,
    };
  }, [days, year]);

  useEffect(() => {
    const scroller = scrollRef.current;
    const current = scroller?.querySelector<HTMLElement>('[data-latest-week]');
    if (scroller && current) {
      scroller.scrollLeft += Math.max(0, current.getBoundingClientRect().right - scroller.getBoundingClientRect().right + 6);
    }
  }, [latestColumn, year]);

  const level = (count: number) =>
    count <= 0 ? 0 : Math.min(4, Math.ceil((count / maxItems) * 4));

  if (year === null) {
    return <p role="status" className="dashboard-subtle">Chưa có dữ liệu hoạt động.</p>;
  }

  return (
    <div>
      {/* Header bar: Year summary on left, legend on right */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-fg">
            {formatNumber(totalYearItems)} lượt học trong năm {year}
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

      {/* Calendar grid with blank future dates */}
      <div
        ref={scrollRef}
        className="overflow-x-auto relative pb-2 [scrollbar-width:thin] select-none"
      >
        <div
          className="grid min-w-[700px] w-full gap-[3px] items-center"
          style={{
            gridTemplateColumns: `32px repeat(${weeks.length || 53}, minmax(0, 1fr))`,
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
            Mon
          </span>
          <span
            style={{ gridColumn: 1, gridRow: 4 }}
            className="text-[10px] text-fg-60 pr-1 text-right self-center leading-none"
            aria-hidden="true"
          >
            Wed
          </span>
          <span
            style={{ gridColumn: 1, gridRow: 6 }}
            className="text-[10px] text-fg-60 pr-1 text-right self-center leading-none"
            aria-hidden="true"
          >
            Fri
          </span>

          {/* Rows 2-8, Columns 2-(weeks+1): Calendar cells */}
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
                  data-latest-week={cell === latest ? true : undefined}
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
