// Animation timing configurations
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,
};

// Spring configurations
export const SPRING_CONFIG = {
  BOUNCY: {
    damping: 10,
    mass: 0.8,
    stiffness: 100,
  },
  SMOOTH: {
    damping: 20,
    mass: 1,
    stiffness: 100,
  },
  SNAPPY: {
    damping: 15,
    mass: 0.5,
    stiffness: 150,
  },
};

// Stagger delays for sequential animations
export const STAGGER_DELAY = {
  FAST: 50,
  NORMAL: 100,
  SLOW: 150,
};

// Easing functions
export const EASING = {
  IN_OUT: 'ease-in-out',
  IN: 'ease-in',
  OUT: 'ease-out',
  LINEAR: 'linear',
};

// Common animation values
export const SCALE = {
  PRESS: 0.96,
  HOVER: 1.02,
  DEFAULT: 1,
  SMALL: 0.8,
};

export const OPACITY = {
  HIDDEN: 0,
  VISIBLE: 1,
  SEMI: 0.5,
};

export const TRANSLATE = {
  SLIDE_UP: 20,
  SLIDE_DOWN: -20,
  SLIDE_LEFT: -20,
  SLIDE_RIGHT: 20,
};
