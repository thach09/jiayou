import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { initializeTheme } from '../../src/app/useTheme';
import { OrientalDecorBackground } from '../../src/components/OrientalDecorBackground';
import { SentenceOrderExercise } from '../../src/features/grammar/SentenceOrderExercise';

afterEach(() => { document.documentElement.removeAttribute('data-theme'); });
test('official dark theme is enforced and survives initialization regardless of stale storage', () => {
  localStorage.setItem('chinese-learning-theme', 'light');
  initializeTheme();
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(initializeTheme()).toBe('dark');
});
test('official dark theme remains dark when storage event fires', () => {
  initializeTheme();
  localStorage.setItem('chinese-learning-theme', 'light');
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'chinese-learning-theme' })));
  expect(document.documentElement.dataset.theme).toBe('dark');
});
test('ceiling lanterns disappear after 20px and return at the top', () => {
  vi.stubGlobal('scrollY', 0);
  const { container, unmount } = render(<OrientalDecorBackground />);
  const lanterns = container.querySelector('[data-lanterns]')!;
  expect(lanterns.className).toContain('absolute');
  expect(lanterns.className).toContain('opacity-100');
  vi.stubGlobal('scrollY', 20); fireEvent.scroll(window);
  expect(lanterns.className).toContain('opacity-100');
  vi.stubGlobal('scrollY', 21); fireEvent.scroll(window);
  expect(lanterns.className).toContain('opacity-0');
  vi.stubGlobal('scrollY', 0); fireEvent.scroll(window);
  expect(lanterns.className).toContain('opacity-100');
  const remove = vi.spyOn(window, 'removeEventListener'); unmount();
  expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function)); remove.mockRestore();
});
test('ordering preserves repeated tokens, supports undo and submits the complete sentence', () => {
  const submit = vi.fn();
  render(<SentenceOrderExercise tokens={['我', '是', '我']} disabled={false} onSubmit={submit} />);
  fireEvent.click(screen.getAllByRole('button', { name: '我', exact: true })[0]);
  fireEvent.click(screen.getByRole('button', { name: '是', exact: true }));
  fireEvent.click(screen.getAllByRole('button', { name: '我', exact: true }).filter(button => !(button as HTMLButtonElement).disabled).at(-1)!);
  fireEvent.click(screen.getByRole('button', { name: 'Chấm câu' }));
  expect(submit).toHaveBeenLastCalledWith('我是我');
  fireEvent.click(screen.getByRole('button', { name: 'Xếp lại' }));
  expect((screen.getByRole('button', { name: 'Chấm câu' }) as HTMLButtonElement).disabled).toBe(true);
});
