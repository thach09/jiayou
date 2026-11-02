import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardView } from '../../src/features/dashboard/DashboardView';
const mocks = vi.hoisted(() => ({ user: null as any, api: vi.fn() }));
vi.mock('../../src/app/useAuth', () => ({
  useAuth: () => ({ user: mocks.user, requireLogin: vi.fn() }),
}));
vi.mock('../../src/lib/api/client', () => ({
  apiRequest: (...args: any[]) => mocks.api(...args),
  isRequestCancelled: (e: any) => e?.name === 'AbortError',
}));
vi.mock('../../src/features/companion/CompanionWidget', () => ({
  CompanionWidget: () => null,
}));
vi.mock('../../src/features/dashboard/WeeklyStreak', () => ({
  WeeklyStreak: () => null,
}));
beforeEach(() => {
  mocks.user = null;
  mocks.api.mockReset();
  mocks.api.mockImplementation(async (path: string) => ({
    success: true,
    data:
      path === '/users/me'
        ? {
            id: 1,
            fullName: 'Tên từ máy chủ',
            email: 'fixture@jiayou.test',
            role: 'ROLE_USER',
          }
        : { levels: [], quests: [], wallet: { bamboo: 0, affectionExp: 0 } },
  }));
});
const mount = () =>
  render(
    <MemoryRouter>
      <DashboardView />
    </MemoryRouter>,
  );
test.each(['invalid', 'NaN', '2.5', 'Infinity', '0', '7'])(
  'invalid saved target %s keeps an actionable HSK1 goal',
  (saved) => {
    localStorage.setItem('heyganba_target_hsk', saved);
    mount();
    expect(
      screen.getByRole('button', { name: 'HSK 1', pressed: true }),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Tiếp tục học' }).getAttribute('href'),
    ).toBe('/vocabulary?level=HSK1');
  },
);
test('valid HSK6 goal survives reload', () => {
  localStorage.setItem('heyganba_target_hsk', '6');
  mount();
  expect(
    screen.getByRole('button', { name: 'HSK 6', pressed: true }),
  ).toBeTruthy();
  expect(
    screen.getByRole('link', { name: 'Tiếp tục học' }).getAttribute('href'),
  ).toBe('/vocabulary?level=HSK6');
});
test('failed insights show a retry instead of fictional progress or EXP', async () => {
  mocks.user = { userId: 1, fullName: 'Cached must not appear' };
  mocks.api.mockResolvedValue({
    success: false,
    message: 'Chưa tải được tiến độ.',
  });
  mount();
  expect(
    (await screen.findAllByText(/Chưa tải được tiến độ/)).length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByRole('button', { name: 'Thử lại' }).length,
  ).toBeGreaterThan(0);
  expect(screen.queryByText('24%')).toBeNull();
  expect(screen.queryByText('Cached must not appear')).toBeNull();
});
test('pending metrics stay loading without invented progress', () => {
  mocks.user = { userId: 1 };
  mocks.api.mockReturnValue(new Promise(() => {}));
  mount();
  expect(screen.getAllByText('Đang tải dữ liệu học tập…')).toHaveLength(2);
  expect(screen.queryByText('24%')).toBeNull();
});
test('due review remains an explicit SRS shortcut', () => {
  mount();
  expect(
    screen.getByRole('link', { name: 'Ôn tập đến hạn' }).getAttribute('href'),
  ).toBe('/vocabulary?mode=srs');
});
test('personal greeting uses the owner-checked server profile', async () => {
  mocks.user = { userId: 1, fullName: 'Cached must not appear' };
  mount();
  expect(
    await screen.findByRole('heading', {
      name: 'Chào mừng trở lại, Tên từ máy chủ! 👋',
    }),
  ).toBeTruthy();
  expect(screen.queryByText('Cached must not appear')).toBeNull();
});
