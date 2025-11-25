import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TuiMenu from './TuiMenu';

describe('TuiMenu', () => {
  const defaultProps = {
    items: ['Item 1', 'Item 2', 'Item 3'],
    selectedIndex: 0,
    onSelect: vi.fn(),
    onNavigate: vi.fn(),
  };

  it('renders all menu items', () => {
    render(<TuiMenu {...defaultProps} />);
    expect(screen.getByText(/Item 1/)).toBeInTheDocument();
    expect(screen.getByText(/Item 2/)).toBeInTheDocument();
    expect(screen.getByText(/Item 3/)).toBeInTheDocument();
  });

  it('has menu role', () => {
    render(<TuiMenu {...defaultProps} />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('has menuitem roles for each item', () => {
    render(<TuiMenu {...defaultProps} />);
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems).toHaveLength(3);
  });

  it('marks selected item with aria-selected', () => {
    render(<TuiMenu {...defaultProps} selectedIndex={1} />);
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems[0]).toHaveAttribute('aria-selected', 'false');
    expect(menuItems[1]).toHaveAttribute('aria-selected', 'true');
    expect(menuItems[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onSelect when item is clicked', () => {
    const onSelect = vi.fn();
    render(<TuiMenu {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/Item 2/));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('shows selection indicator on selected item', () => {
    render(<TuiMenu {...defaultProps} selectedIndex={0} />);
    expect(screen.getByText(/▶ Item 1/)).toBeInTheDocument();
  });
});



