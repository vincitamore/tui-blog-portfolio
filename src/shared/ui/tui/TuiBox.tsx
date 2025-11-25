import React from 'react';
import { motion } from 'framer-motion';

interface TuiBoxProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  animate?: boolean;
}

/**
 * TUI Box component with optional animation.
 * Provides the characteristic terminal-style bordered container.
 */
const TuiBox: React.FC<TuiBoxProps> = ({
  children,
  className = '',
  glow = true,
  animate = true,
}) => {
  const boxClasses = `border-4 border-ansi-green p-12 font-mono shadow-2xl ${glow ? 'shadow-glow-green' : ''} ${className}`;

  if (!animate) {
    return <div className={boxClasses}>{children}</div>;
  }

  return (
    <motion.div
      className={boxClasses}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export default TuiBox;
