import React from 'react';

export interface NavAction {
  key: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success';
  disabled?: boolean;
}

interface TouchNavProps {
  actions: NavAction[];
  className?: string;
}

/**
 * Touch-friendly navigation bar that makes keyboard shortcuts clickable
 * Displays as compact text on desktop, larger touch targets on mobile
 */
const TouchNav: React.FC<TouchNavProps> = ({ actions, className = '' }) => {
  const getVariantStyles = (variant: NavAction['variant'] = 'default') => {
    switch (variant) {
      case 'danger':
        return {
          color: 'var(--term-error)',
          borderColor: 'var(--term-error)',
        };
      case 'success':
        return {
          color: 'var(--term-success)',
          borderColor: 'var(--term-success)',
        };
      default:
        return {
          color: 'var(--term-primary)',
          borderColor: 'var(--term-border)',
        };
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {actions.map((action) => {
        const styles = getVariantStyles(action.variant);
        return (
          <button
            key={action.key}
            onClick={action.onClick}
            disabled={action.disabled}
            className="
              px-3 py-2 text-sm font-mono
              transition-all duration-150
              hover:brightness-125 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              touch-manipulation
              min-w-[44px] min-h-[44px]
              flex items-center justify-center gap-1
            "
            style={{
              backgroundColor: 'var(--term-selection)',
              color: styles.color,
              border: `1px solid ${styles.borderColor}`,
            }}
          >
            <span className="opacity-70">[{action.key}]</span>
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TouchNav;

