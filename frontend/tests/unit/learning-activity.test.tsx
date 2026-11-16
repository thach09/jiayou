import { render, screen, within } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { LearningActivityDetails } from '../../src/features/dashboard/LearningActivityDetails';

const fixture = vi.hoisted(() => ({ heatmap: vi.fn(), stats: vi.fn() }));
vi.mock('../../src/app/useAuth', () => ({ useAuth: () => ({ user: { userId: 101 } }) }));
vi.mock('../../src/features/progress/api', () => ({ progressApi: { heatmap: fixture.heatmap } }));
vi.mock('../../src/features/flashcard/api', () => ({ flashcardApi: { stats: fixture.stats } }));
beforeEach(() => { vi.clearAllMocks(); });

test('requests 365 days, keeps the newest seven totals and labels lifetime learned words separately', async () => {
  const days = Array.from({ length: 365 }, (_, i) => ({
    date: new Date(Date.UTC(2025, 10, 17 + i)).toISOString().slice(0, 10),
    itemCount: i < 358 ? 100 : 2,
    correctCount: i < 358 ? 90 : 1,
  }));
  fixture.heatmap.mockResolvedValue({ success: true, data: days });
  fixture.stats.mockResolvedValue({ success: true, data: { learnedWords: 42 } });
  render(<LearningActivityDetails />);
  const chart = await screen.findByRole('region', { name: 'Bản đồ nhiệt hoạt động học 1 năm' });
  expect(fixture.heatmap).toHaveBeenCalledWith(365, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(chart.querySelectorAll('i[title]').length).toBe(365);
  const months = [...chart.querySelectorAll('span')].filter(e => /^Thg /.test(e.textContent ?? ''));
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
