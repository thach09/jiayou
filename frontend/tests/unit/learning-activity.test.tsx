import { render, screen, within } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { LearningActivityDetails } from '../../src/features/dashboard/LearningActivityDetails';

const fixture = vi.hoisted(() => ({ heatmap: vi.fn(), stats: vi.fn() }));
vi.mock('../../src/app/useAuth', () => ({ useAuth: () => ({ user: { userId: 101 } }) }));
vi.mock('../../src/features/progress/api', () => ({ progressApi: { heatmap: fixture.heatmap } }));
vi.mock('../../src/features/flashcard/api', () => ({ flashcardApi: { stats: fixture.stats } }));
beforeEach(() => { vi.clearAllMocks(); });

test('shows the current calendar year without changing the last seven days or lifetime totals', async () => {
  const days = Array.from({ length: 366 }, (_, i) => ({
    date: new Date(Date.UTC(2025, 10, 17 + i)).toISOString().slice(0, 10),
    itemCount: i < 359 ? 100 : 2,
    correctCount: i < 359 ? 90 : 1,
  }));
  fixture.heatmap.mockResolvedValue({ success: true, data: days });
  fixture.stats.mockResolvedValue({ success: true, data: { learnedWords: 42 } });
  render(<LearningActivityDetails />);
  const chart = await screen.findByRole('region', { name: 'Bản đồ nhiệt hoạt động học 1 năm' });
  expect(fixture.heatmap).toHaveBeenCalledWith(366, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(chart.querySelectorAll('i[title]').length).toBe(321);
  expect(within(chart).getByText('31.414 lượt học trong năm 2026')).toBeTruthy();
  expect(within(chart).getByText('Mon')).toBeTruthy();
  expect(within(chart).getByText('Wed')).toBeTruthy();
  expect(within(chart).getByText('Fri')).toBeTruthy();
  expect(within(chart).getByText('Jan')).toBeTruthy();
  const months = [...chart.querySelectorAll('span')].filter(e => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/.test(e.textContent ?? ''));
  expect(months.map(e => e.textContent)).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
  for (let i = 1; i < months.length; i++) {
    expect(Number((months[i] as HTMLElement).style.gridColumn) - Number((months[i - 1] as HTMLElement).style.gridColumn)).toBeGreaterThanOrEqual(3);
  }
  const recent = within(screen.getByRole('region', { name: 'Thống kê 7 ngày gần nhất' }));
  expect(recent.getByText('14')).toBeTruthy();
  expect(recent.getByText('7')).toBeTruthy();
  expect(recent.getByText('42')).toBeTruthy();
  expect(recent.getByText('Từ đã ôn nhớ (tổng)')).toBeTruthy();
});

test('failed heatmap shows retry and no invented zero activity', async () => {
  fixture.heatmap.mockResolvedValue({ success: false, data: null });
  fixture.stats.mockResolvedValue({ success: false, data: null });
  render(<LearningActivityDetails />);
  expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeTruthy();
  expect(screen.queryByText('0 lượt học trong năm qua')).toBeNull();
});
