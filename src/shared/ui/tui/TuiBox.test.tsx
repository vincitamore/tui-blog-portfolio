import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TuiBox from './TuiBox';

describe('TuiBox', () => {
  it('renders children correctly', () => {
    render(<TuiBox>Test Content</TuiBox>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<TuiBox className="custom-class">Content</TuiBox>);
    const box = container.firstChild as HTMLElement;
    expect(box.classList.contains('custom-class')).toBe(true);
  });

  it('applies glow class by default', () => {
    const { container } = render(<TuiBox>Content</TuiBox>);
    const box = container.firstChild as HTMLElement;
    expect(box.classList.contains('shadow-glow-green')).toBe(true);
  });

  it('does not apply glow class when glow=false', () => {
    const { container } = render(<TuiBox glow={false}>Content</TuiBox>);
    const box = container.firstChild as HTMLElement;
    expect(box.classList.contains('shadow-glow-green')).toBe(false);
  });

  it('has border styling', () => {
    const { container } = render(<TuiBox>Content</TuiBox>);
    const box = container.firstChild as HTMLElement;
    expect(box.classList.contains('border-4')).toBe(true);
    expect(box.classList.contains('border-ansi-green')).toBe(true);
  });
});



