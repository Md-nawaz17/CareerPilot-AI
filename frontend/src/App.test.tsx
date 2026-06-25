import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the hero heading', () => {
    render(<App />);
    expect(screen.getByText(/AI-Powered Resume Analyzer/i)).toBeInTheDocument();
  });
});
