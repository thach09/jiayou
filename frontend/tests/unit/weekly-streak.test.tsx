import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { WeeklyStreak } from '../../src/features/dashboard/WeeklyStreak';
import { isWeeklyStreak } from '../../src/features/dashboard/streak';
const state = vi.hoisted(() => ({
  user: { userId: 31 } as any,
  api: vi.fn(),
  login: vi.fn(),
}));
vi.mock('../../src/app/useAuth', () => ({
  useAuth: () => ({ user: state.user, requireLogin: state.login }),
}));
vi.mock('../../src/lib/api/client', () => ({
  apiRequest: (...args: any[]) => state.api(...args),
  isRequestCancelled: (e: any) => e?.name === 'AbortError',
}));
const pending = {
  state: 'FROZEN_PENDING',
  currentStreak: 0,
  displayStreak: 12,
  preservedStreak: 12,
  longestStreak: 12,
  todayQualified: false,
  zone: 'Asia/Ho_Chi_Minh',
  today: '2026-11-04',
  weekStart: '2026-11-02',
  days: [
    '2026-11-02',
    '2026-11-03',
    '2026-11-04',
    '2026-11-05',
    '2026-11-06',
    '2026-11-07',
    '2026-11-08',
  ].map((date, i) => ({
    date,
    state: i < 2 ? 'MISSED' : i === 2 ? 'TODAY_PENDING' : 'FUTURE',
    qualified: false,
    restored: false,
  })),
  monthlyLimit: 5,
  usedRestorations: 0,
  remainingRestorations: 5,
  requiredRestorations: 2,
  canRestore: true,
  gapToken: 'a'.repeat(64),
  reason: 'ELIGIBLE_GAP',
  missedDates: ['2026-11-02', '2026-11-03'],
  replayed: false,
};
const restored = {
  ...pending,
  state: 'RESTORED',
  currentStreak: 12,
  usedRestorations: 2,
  remainingRestorations: 3,
  requiredRestorations: 0,
  canRestore: false,
  gapToken: null,
  reason: 'CONTINUITY_PROTECTED',
  missedDates: [],
  days: pending.days.map((d, i) =>
    i < 2 ? { ...d, state: 'RESTORED', restored: true } : d,
  ),
};
beforeEach(() => {
  vi.clearAllMocks();
  state.user = { userId: 31 };
  state.api.mockResolvedValue({ success: true, data: pending });
});
test('guest sees login and sends no private request', () => {
  state.user = null;
  render(<WeeklyStreak />);
  expect(state.api).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(state.login).toHaveBeenCalledOnce();
  expect(screen.queryByText('12 ngày')).toBeNull();
});
test('seven real date cells distinguish missed, today and future without colour alone', async () => {
  render(<WeeklyStreak />);
  await screen.findByText('12 ngày');
  expect(screen.getAllByRole('listitem')).toHaveLength(7);
  expect(screen.getByLabelText('T2, 2026-11-02: Chưa hoàn thành')).toBeTruthy();
  expect(
    screen
      .getByLabelText('T4, 2026-11-04: Hôm nay chưa đủ điều kiện')
      .getAttribute('aria-current'),
  ).toBe('date');
  expect(screen.getByText('Đang tạm dừng')).toBeTruthy();
});
test('duplicate click stays in flight and only confirmed server balance updates UI', async () => {
  let resolve!: (value: any) => void;
  state.api.mockImplementation((path: string) =>
    path === '/streak/week'
      ? Promise.resolve({ success: true, data: pending })
      : new Promise((r) => {
          resolve = r;
        }),
  );
  render(<WeeklyStreak />);
  const button = await screen.findByRole('button', {
    name: 'Khôi phục streak',
  });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(
    state.api.mock.calls.filter((c) => c[0] === '/streak/restore'),
  ).toHaveLength(1);
  expect(screen.getByText(/Còn 5\/5/)).toBeTruthy();
  const body = JSON.parse(
    state.api.mock.calls.find((c) => c[0] === '/streak/restore')![1].body,
  );
  expect(Object.keys(body).sort()).toEqual(['gapToken', 'requestId']);
  expect(body.gapToken).toBe(pending.gapToken);
  resolve({ success: true, data: restored });
  await screen.findByText(/Còn 3\/5/);
  expect(screen.getByLabelText(/T2, 2026-11-02: Đã bảo vệ/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Khôi phục streak' })).toBeNull();
});
test('a delayed status GET cannot overwrite confirmed restoration', async () => {
  let resolveOld!: (value: any) => void;
  let reads = 0;
  state.api.mockImplementation((path: string) => {
    if (path === '/streak/restore')
      return Promise.resolve({ success: true, data: restored });
    return ++reads === 1
      ? Promise.resolve({ success: true, data: pending })
      : new Promise((resolve) => {
          resolveOld = resolve;
        });
  });
  render(<WeeklyStreak />);
  const button = await screen.findByRole('button', {
    name: 'Khôi phục streak',
  });
  fireEvent(window, new Event('focus'));
  expect(reads).toBe(2);
  fireEvent.click(button);
  await screen.findByText(/Còn 3\/5/);
  await act(async () => {
    resolveOld({ success: true, data: pending });
  });
  expect(screen.getByText(/Còn 3\/5/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Khôi phục streak' })).toBeNull();
});
test('failed restore does not spend locally and retry reuses the same request UUID', async () => {
  let attempts = 0;
  state.api.mockImplementation(async (path: string) =>
    path === '/streak/week'
      ? { success: true, data: pending }
      : ++attempts === 1
        ? { success: false, message: 'Kết nối bị gián đoạn.' }
        : { success: true, data: restored },
  );
  render(<WeeklyStreak />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Khôi phục streak' }),
  );
  await screen.findByText(/Kết nối bị gián đoạn/);
  expect(screen.getByText(/Còn 5\/5/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Khôi phục streak' }));
  await screen.findByText(/Còn 3\/5/);
  const bodies = state.api.mock.calls
    .filter((c) => c[0] === '/streak/restore')
    .map((c) => JSON.parse(c[1].body));
  expect(bodies[0].requestId).toBe(bodies[1].requestId);
});
test('malformed balance or calendar fails closed with retry', async () => {
  state.api.mockResolvedValue({
    success: true,
    data: { ...pending, days: [] },
  });
  render(<WeeklyStreak />);
  await screen.findByRole('button', { name: 'Thử lại' });
  expect(screen.queryByText('12 ngày')).toBeNull();
  expect(isWeeklyStreak({ ...pending, remainingRestorations: 99 })).toBe(false);
  expect(
    isWeeklyStreak({ ...pending, days: [null, ...pending.days.slice(1)] }),
  ).toBe(false);
});
test('logout during pending restoration cannot display the previous account result', async () => {
  let resolve!: (value: any) => void;
  state.api.mockImplementation((path: string) =>
    path === '/streak/week'
      ? Promise.resolve({ success: true, data: pending })
      : new Promise((r) => {
          resolve = r;
        }),
  );
  const view = render(<WeeklyStreak />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Khôi phục streak' }),
  );
  state.user = null;
  view.rerender(<WeeklyStreak />);
  resolve({ success: true, data: restored });
  await waitFor(() => expect(screen.queryByText('12 ngày')).toBeNull());
  expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeTruthy();
});
test('zero allowance is explained without a restore button', async () => {
  state.api.mockResolvedValue({
    success: true,
    data: {
      ...pending,
      state: 'BROKEN',
      displayStreak: 0,
      usedRestorations: 5,
      remainingRestorations: 0,
      canRestore: false,
      gapToken: null,
      reason: 'INSUFFICIENT_ALLOWANCE',
    },
  });
  render(<WeeklyStreak />);
  await screen.findByText(/tháng này không còn đủ/);
  expect(screen.queryByRole('button', { name: 'Khôi phục streak' })).toBeNull();
});
