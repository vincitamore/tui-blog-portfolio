import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type Direction = 'up' | 'down' | 'left' | 'right';

interface SlideInProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

const getInitialPosition = (direction: Direction, distance: number) => {
  switch (direction) {
    case 'up':
      return { y: distance };
    case 'down':
      return { y: -distance };
    case 'left':
      return { x: distance };
    case 'right':
      return { x: -distance };
  }
};

/**
 * Slide in animation wrapper component.
 */
const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.4,
  distance = 30,
  className = '',
  ...props
}) => {
  const initialPosition = getInitialPosition(direction, distance);

  return (
    <motion.div
      initial={{ opacity: 0, ...initialPosition }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...initialPosition }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default SlideIn;



