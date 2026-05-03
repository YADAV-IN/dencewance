import { beforeEach, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({}),
    })
  );
});

test('renders DenceWance brand title', () => {
  render(<App />);
  const titles = screen.getAllByText(/DenceWance/i);
  expect(titles.length).toBeGreaterThan(0);
});
