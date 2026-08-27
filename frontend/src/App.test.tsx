import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { ThemeProvider } from './theme/ThemeContext';

vi.stubGlobal('IntersectionObserver', class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
});

describe('App', () => {
  it('renders the hero heading', () => {
    window.localStorage.setItem('careerpilot-theme', 'light');
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );
    expect(screen.getByRole('heading', { name: /get past the scanner.*then get the offer/i })).not.toBeNull();
  });
});
