import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for combining class names with Tailwind CSS merge support
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Generate responsive classes for mobile-first design
 */
export function responsive(mobile, tablet, desktop) {
  return cn(
    mobile,
    tablet && `sm:${tablet}`,
    desktop && `lg:${desktop}`
  );
}

/**
 * Create focus-visible classes for accessibility
 */
export function focusRing(color = 'blue-500') {
  return cn(
    'focus:outline-none',
    'focus-visible:ring-2',
    `focus-visible:ring-${color}`,
    'focus-visible:ring-offset-2',
    'focus-visible:ring-offset-white'
  );
}

/**
 * Generate touch-friendly sizing for mobile
 */
export function touchTarget(size = 'md') {
  const sizes = {
    sm: 'min-h-[40px] min-w-[40px]',
    md: 'min-h-[44px] min-w-[44px]',
    lg: 'min-h-[48px] min-w-[48px]',
  };
  
  return cn(sizes[size], 'touch-manipulation');
}

/**
 * Create safe area aware padding for mobile devices
 */
export function safeArea(sides = 'all') {
  const sideClasses = {
    all: 'safe-area-inset',
    top: 'pt-[env(safe-area-inset-top)]',
    bottom: 'pb-[env(safe-area-inset-bottom)]',
    left: 'pl-[env(safe-area-inset-left)]',
    right: 'pr-[env(safe-area-inset-right)]',
  };
  
  return sideClasses[sides] || sideClasses.all;
}

/**
 * Generate animation classes with reduced motion support
 */
export function animation(name, options = {}) {
  const { 
    duration = '200ms',
    delay = '0ms',
    timing = 'ease-in-out',
    respectMotion = true 
  } = options;
  
  return cn(
    `animate-${name}`,
    respectMotion && 'motion-safe:animate-none motion-reduce:animate-none'
  );
}

export default cn;