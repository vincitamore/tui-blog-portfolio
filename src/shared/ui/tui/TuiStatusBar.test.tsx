import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TuiStatusBar from './TuiStatusBar';

describe('TuiStatusBar', () => {
  it('renders current screen', () => {
    render(<TuiStatusBar currentScreen="home > portfolio" />);
    expect(screen.getByText(/home > portfolio/)).toBeInTheDocument();
  });

  it('renders default help text', () => {
    render(<TuiStatusBar currentScreen="home" />);
    expect(screen.getByText(/nav/)).toBeInTheDocument();
  });

  it('renders custom help text', () => {
    render(<TuiStatusBar currentScreen="home" helpText="Custom help" />);
    expect(screen.getByText('Custom help')).toBeInTheDocument();
  });

  it('has status role', () => {
    render(<TuiStatusBar currentScreen="home" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live polite for accessibility', () => {
    render(<TuiStatusBar currentScreen="home" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('is positioned fixed at bottom', () => {
    const { container } = render(<TuiStatusBar currentScreen="home" />);
    const statusBar = container.firstChild as HTMLElement;
    expect(statusBar.classList.contains('fixed')).toBe(true);
    expect(statusBar.classList.contains('bottom-0')).toBe(true);
  });
});



