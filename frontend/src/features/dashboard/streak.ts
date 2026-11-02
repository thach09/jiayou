export type StreakState =
  | 'ACTIVE'
  | 'AT_RISK'
  | 'FROZEN_PENDING'
  | 'RESTORED'
  | 'BROKEN';
export type StreakDayState =
  | 'COMPLETED'
  | 'TODAY_COMPLETED'
  | 'TODAY_PENDING'
  | 'MISSED'
  | 'RESTORED'
  | 'FUTURE';
export interface WeeklyStreak {
  state: StreakState;
  currentStreak: number;
  displayStreak: number;
  preservedStreak: number;
  longestStreak: number;
  todayQualified: boolean;
  zone: string;
  today: string;
  weekStart: string;
  days: {
    date: string;
    state: StreakDayState;
    qualified: boolean;
    restored: boolean;
  }[];
  monthlyLimit: number;
  usedRestorations: number;
  remainingRestorations: number;
  requiredRestorations: number;
  canRestore: boolean;
  gapToken: string | null;
  reason: string;
  missedDates: string[];
  replayed: boolean;
}

/** Reject incompatible/malformed responses instead of rendering invented balances or a broken calendar. */
export function isWeeklyStreak(value: unknown): value is WeeklyStreak {
  if (!value || typeof value !== 'object') return false;
  const s = value as WeeklyStreak;
  const states = ['ACTIVE', 'AT_RISK', 'FROZEN_PENDING', 'RESTORED', 'BROKEN'];
  const dayStates = [
    'COMPLETED',
    'TODAY_COMPLETED',
    'TODAY_PENDING',
    'MISSED',
    'RESTORED',
    'FUTURE',
  ];
  const date = (v: unknown) =>
    typeof v === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !Number.isNaN(Date.parse(v + 'T00:00:00Z')) &&
    new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;
  if (
    !states.includes(s.state) ||
    !date(s.today) ||
    !date(s.weekStart) ||
    !Array.isArray(s.days) ||
    s.days.length !== 7
  )
    return false;
  if (new Date(s.weekStart + 'T00:00:00Z').getUTCDay() !== 1) return false;
  if (
    !s.days.every(
      (d, i) =>
        d &&
        typeof d === 'object' &&
        date(d.date) &&
        Date.parse(d.date + 'T00:00:00Z') ===
          Date.parse(s.weekStart + 'T00:00:00Z') + i * 86400000 &&
        dayStates.includes(d.state) &&
        typeof d.qualified === 'boolean' &&
        typeof d.restored === 'boolean',
    )
  )
    return false;
  if (
    ![
      s.currentStreak,
      s.displayStreak,
      s.preservedStreak,
      s.longestStreak,
      s.usedRestorations,
      s.remainingRestorations,
      s.requiredRestorations,
    ].every((n) => Number.isInteger(n) && n >= 0)
  )
    return false;
  if (
    s.monthlyLimit !== 5 ||
    s.usedRestorations + s.remainingRestorations !== 5 ||
    s.remainingRestorations > 5 ||
    s.requiredRestorations > 7
  )
    return false;
  if (
    !Array.isArray(s.missedDates) ||
    s.missedDates.length !== s.requiredRestorations ||
    !s.missedDates.every(date)
  )
    return false;
  return (
    typeof s.canRestore === 'boolean' &&
    typeof s.todayQualified === 'boolean' &&
    typeof s.zone === 'string' &&
    (!s.canRestore ||
      (s.state === 'FROZEN_PENDING' &&
        s.requiredRestorations > 0 &&
        s.requiredRestorations <= s.remainingRestorations &&
        typeof s.gapToken === 'string' &&
        /^[a-f0-9]{64}$/.test(s.gapToken)))
  );
}
