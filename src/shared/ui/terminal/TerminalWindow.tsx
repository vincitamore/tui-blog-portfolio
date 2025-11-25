import React from 'react';
import { motion } from 'framer-motion';

interface TerminalWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Terminal window frame with title bar.
 * Creates a 3D floating terminal effect.
 */
const TerminalWindow: React.FC<TerminalWindowProps> = ({
  title = 'visitor@amore.build',
  children,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: 2 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`flex flex-col overflow-hidden rounded-lg ${className}`}
      style={{
        backgroundColor: 'var(--term-background)',
        boxShadow: `
          0 0 0 1px var(--term-border),
          0 4px 6px -1px rgba(0, 0, 0, 0.3),
          0 12px 24px -4px rgba(0, 0, 0, 0.4),
          0 24px 48px -8px rgba(0, 0, 0, 0.3),
          0 0 80px -20px var(--term-primary)
        `,
        transform: 'perspective(1000px)',
      }}
    >
      {/* Title bar with glass effect */}
      <div
        className="flex items-center px-4 py-3 gap-3 select-none"
        style={{
          background: `linear-gradient(180deg, 
            color-mix(in srgb, var(--term-selection) 90%, white 10%) 0%, 
            var(--term-selection) 100%
          )`,
          borderBottom: '1px solid var(--term-border)',
        }}
      >
        {/* Window buttons with hover effects */}
        <div className="flex gap-2">
          <motion.div
            whileHover={{ scale: 1.2 }}
            className="w-3 h-3 rounded-full cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #ff5f56 0%, #e0443e 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          />
          <motion.div
            whileHover={{ scale: 1.2 }}
            className="w-3 h-3 rounded-full cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #ffbd2e 0%, #dea123 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          />
          <motion.div
            whileHover={{ scale: 1.2 }}
            className="w-3 h-3 rounded-full cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #27ca40 0%, #1aab32 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          />
        </div>
        {/* Title */}
        <span
          className="flex-1 text-center text-sm font-medium tracking-wide"
          style={{ 
            color: 'var(--term-muted)',
            textShadow: '0 1px 0 rgba(0,0,0,0.3)',
          }}
        >
          {title}
        </span>
        {/* Spacer for symmetry */}
        <div className="w-[52px]" />
      </div>

      {/* Terminal content with subtle inner shadow */}
      <div 
        className="flex-1 overflow-hidden relative"
        style={{
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        {children}
        {/* Subtle reflection/glow at top */}
        <div 
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--term-border), transparent)',
          }}
        />
      </div>
    </motion.div>
  );
};

export default TerminalWindow;
