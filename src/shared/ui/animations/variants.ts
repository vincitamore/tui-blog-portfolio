import type { Variants } from 'framer-motion';

/**
 * Container variant for staggered children animations.
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Item variant for staggered list items.
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Fade in and slide up animation.
 */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Scale in animation for cards and buttons.
 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

/**
 * Glow pulse animation for selected items.
 */
export const glowPulse: Variants = {
  idle: {
    boxShadow: '0 0 0px rgba(0, 255, 0, 0)',
  },
  selected: {
    boxShadow: [
      '0 0 10px rgba(0, 255, 0, 0.3)',
      '0 0 20px rgba(0, 255, 0, 0.5)',
      '0 0 10px rgba(0, 255, 0, 0.3)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};



