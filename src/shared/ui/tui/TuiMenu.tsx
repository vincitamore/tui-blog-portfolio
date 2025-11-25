import React from 'react';
import { motion } from 'framer-motion';

interface TuiMenuProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onNavigate: (direction: 'up' | 'down') => void;
}

/**
 * TUI Menu component with keyboard navigation and animations.
 */
const TuiMenu: React.FC<TuiMenuProps> = ({ items, selectedIndex, onSelect, onNavigate }) => (
  <div
    role="menu"
    aria-label="Main navigation menu"
    className="flex flex-col items-center space-y-2"
  >
    {items.map((item, index) => (
      <motion.div
        key={item}
        initial={{ opacity: 0, x: -20 }}
        animate={{
          opacity: 1,
          x: 0,
          transition: {
            delay: index * 0.1,
            duration: 0.3,
            ease: 'easeOut',
          },
        }}
        role="menuitem"
        tabIndex={-1}
        aria-selected={selectedIndex === index}
        className={`py-6 px-12 w-full max-w-md text-center cursor-pointer transition-all duration-150 border-2 border-transparent hover:border-ansi-bright-green hover:shadow-lg ${
          selectedIndex === index
            ? 'bg-ansi-bright-green text-black font-bold shadow-md scale-105'
            : 'text-ansi-green hover:bg-ansi-green/20'
        }`}
        onMouseEnter={() => onNavigate(index < selectedIndex ? 'up' : 'down')}
        onClick={() => onSelect(index)}
        whileHover={{ scale: selectedIndex === index ? 1.05 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {selectedIndex === index ? '▶ ' : '  '}
        {item}
      </motion.div>
    ))}
  </div>
);

export default TuiMenu;
