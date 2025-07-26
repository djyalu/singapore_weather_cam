/**
 * Accessibility utilities for better user experience
 * Provides functions for screen readers, keyboard navigation, and inclusive design
 */

/**
 * Announce content to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Generate unique IDs for form elements and labels
 */
export const generateId = (prefix = 'element') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user is using high contrast mode
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Get color scheme preference
 */
export const getColorSchemePreference = () => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

/**
 * Focus management utilities
 */
export const focusUtils = {
  // Trap focus within an element
  trapFocus: (element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  },

  // Restore focus to previously focused element
  restoreFocus: (previousElement) => {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  },

  // Get all focusable elements within a container
  getFocusableElements: (container) => {
    return container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
  },
};

/**
 * Keyboard navigation utilities
 */
export const keyboardUtils = {
  // Arrow key navigation for lists
  handleArrowNavigation: (event, items, currentIndex, onChange) => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    onChange(newIndex);
    items[newIndex]?.focus();
  },

  // Handle escape key
  handleEscape: (callback) => (event) => {
    if (event.key === 'Escape') {
      callback();
    }
  },

  // Handle enter/space activation
  handleActivation: (callback) => (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  },
};

/**
 * ARIA utilities
 */
export const ariaUtils = {
  // Describe an element with another element's content
  describeElement: (element, descriptionElement) => {
    const descriptionId = generateId('description');
    descriptionElement.id = descriptionId;
    element.setAttribute('aria-describedby', descriptionId);
  },

  // Label an element with another element's content
  labelElement: (element, labelElement) => {
    const labelId = generateId('label');
    labelElement.id = labelId;
    element.setAttribute('aria-labelledby', labelId);
  },

  // Toggle aria-expanded attribute
  toggleExpanded: (element, isExpanded) => {
    element.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  },

  // Set live region updates
  setLiveRegion: (element, politeness = 'polite', atomic = true) => {
    element.setAttribute('aria-live', politeness);
    element.setAttribute('aria-atomic', atomic ? 'true' : 'false');
  },
};

/**
 * Screen reader utilities
 */
export const screenReaderUtils = {
  // Hide element from screen readers
  hide: (element) => {
    element.setAttribute('aria-hidden', 'true');
  },

  // Show element to screen readers
  show: (element) => {
    element.removeAttribute('aria-hidden');
  },

  // Create screen reader only text
  createSROnlyText: (text) => {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  },
};

/**
 * Color contrast utilities
 */
export const contrastUtils = {
  // Calculate relative luminance
  getLuminance: (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1, color2) => {
    const lum1 = contrastUtils.getLuminance(color1);
    const lum2 = contrastUtils.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (color1, color2, level = 'AA') => {
    const ratio = contrastUtils.getContrastRatio(color1, color2);
    return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
  },
};

/**
 * Motion utilities
 */
export const motionUtils = {
  // Apply animation only if user doesn't prefer reduced motion
  conditionalAnimation: (element, animationClass) => {
    if (!prefersReducedMotion()) {
      element.classList.add(animationClass);
    }
  },

  // Remove animations for users who prefer reduced motion
  respectMotionPreferences: () => {
    if (prefersReducedMotion()) {
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
  },
};

/**
 * Initialize accessibility features
 */
export const initializeAccessibility = () => {
  // Respect motion preferences
  motionUtils.respectMotionPreferences();

  // Add skip links if not present
  if (!document.querySelector('.skip-link')) {
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Monitor for focus indicators
  let hadKeyboardEvent = true;
  const keydownThrottleTimeout = 100;
  let keydownTimeout;

  const handleKeydown = () => {
    hadKeyboardEvent = true;
    clearTimeout(keydownTimeout);
    keydownTimeout = setTimeout(() => {
      hadKeyboardEvent = false;
    }, keydownThrottleTimeout);
  };

  const handleMousedown = () => {
    hadKeyboardEvent = false;
  };

  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('mousedown', handleMousedown);

  // Update body class based on input method
  setInterval(() => {
    document.body.classList.toggle('user-is-tabbing', hadKeyboardEvent);
  }, 100);
};