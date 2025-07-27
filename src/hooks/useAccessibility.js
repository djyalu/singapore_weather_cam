import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Enhanced Accessibility Hook
 * Provides comprehensive accessibility features and keyboard navigation
 */
export const useAccessibility = (options = {}) => {
  const {
    enableFocusManagement = true,
    enableKeyboardNavigation = true,
    enableScreenReaderSupport = true,
    enableReducedMotion = true,
    announceChanges = true,
  } = options;

  const [focusedElement, setFocusedElement] = useState(null);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [hasReducedMotion, setHasReducedMotion] = useState(false);
  const announcementRef = useRef(null);

  // Detect keyboard usage
  useEffect(() => {
    if (!enableKeyboardNavigation) {return;}

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
        document.body.classList.add('user-is-tabbing');
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      document.body.classList.remove('user-is-tabbing');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enableKeyboardNavigation]);

  // Check for reduced motion preference
  useEffect(() => {
    if (!enableReducedMotion) {return;}

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setHasReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setHasReducedMotion(e.matches);
      document.documentElement.style.setProperty(
        '--motion-duration',
        e.matches ? '0.01ms' : '300ms',
      );
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [enableReducedMotion]);

  // Focus management
  const manageFocus = useCallback((element, options = {}) => {
    if (!enableFocusManagement || !element) {return;}

    const {
      preventScroll = false,
      restoreFocus = false,
      trapFocus = false,
    } = options;

    if (restoreFocus && focusedElement) {
      focusedElement.focus({ preventScroll });
      setFocusedElement(null);
    } else {
      const currentFocus = document.activeElement;
      setFocusedElement(currentFocus);
      element.focus({ preventScroll });

      if (trapFocus) {
        createFocusTrap(element);
      }
    }
  }, [enableFocusManagement, focusedElement]);

  // Create focus trap for modals and dialogs
  const createFocusTrap = useCallback((container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') {return;}

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
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  // Screen reader announcements
  const announce = useCallback((message, priority = 'polite') => {
    if (!enableScreenReaderSupport || !announceChanges) {return;}

    if (!announcementRef.current) {
      // Create announcement container if it doesn't exist
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      document.body.appendChild(announcement);
      announcementRef.current = announcement;
    }

    // Clear previous message
    announcementRef.current.textContent = '';

    // Set new message after a brief delay to ensure it's announced
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = message;
      }
    }, 100);

    // Clear message after announcement
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    }, 1000);
  }, [enableScreenReaderSupport, announceChanges]);

  // Keyboard navigation helpers
  const handleArrowKeys = useCallback((e, items, currentIndex, onSelect) => {
    if (!enableKeyboardNavigation) {return;}

    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        newIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(currentIndex);
        return;
      default:
        return;
    }

    // Focus the new item
    if (items[newIndex]) {
      items[newIndex].focus();
    }
  }, [enableKeyboardNavigation]);

  // Skip link functionality
  const createSkipLink = useCallback((targetId, label = 'Skip to main content') => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50';
    skipLink.textContent = label;
    skipLink.setAttribute('tabindex', '0');

    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    document.body.insertBefore(skipLink, document.body.firstChild);

    return () => {
      if (skipLink.parentNode) {
        skipLink.parentNode.removeChild(skipLink);
      }
    };
  }, []);

  // Color contrast helpers
  const checkColorContrast = useCallback((foreground, background) => {
    // Simple contrast ratio calculation
    const getLuminance = (color) => {
      const rgb = color.match(/\d+/g);
      if (!rgb) {return 0;}

      const [r, g, b] = rgb.map(c => {
        c = parseInt(c) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      passAA: ratio >= 4.5,
      passAAA: ratio >= 7,
      level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail',
    };
  }, []);

  // ARIA helpers
  const setAriaExpanded = useCallback((element, expanded) => {
    if (element) {
      element.setAttribute('aria-expanded', expanded.toString());
    }
  }, []);

  const setAriaSelected = useCallback((element, selected) => {
    if (element) {
      element.setAttribute('aria-selected', selected.toString());
    }
  }, []);

  const setAriaChecked = useCallback((element, checked) => {
    if (element) {
      element.setAttribute('aria-checked', checked.toString());
    }
  }, []);

  // Cleanup announcement container
  useEffect(() => {
    return () => {
      if (announcementRef.current && announcementRef.current.parentNode) {
        announcementRef.current.parentNode.removeChild(announcementRef.current);
      }
    };
  }, []);

  return {
    // State
    isKeyboardUser,
    hasReducedMotion,
    focusedElement,

    // Focus management
    manageFocus,
    createFocusTrap,

    // Announcements
    announce,

    // Keyboard navigation
    handleArrowKeys,
    createSkipLink,

    // Color and contrast
    checkColorContrast,

    // ARIA helpers
    setAriaExpanded,
    setAriaSelected,
    setAriaChecked,
  };
};

/**
 * Focus Trap Hook for Modals and Dialogs
 */
export const useFocusTrap = (isActive = false) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) {return;}

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') {return;}

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        // You can add a callback here to close the modal
        console.log('Escape pressed in focus trap');
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive]);

  return containerRef;
};

/**
 * Keyboard Navigation Hook
 */
export const useKeyboardNavigation = (items, onSelect, initialIndex = 0) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { handleArrowKeys } = useAccessibility();

  const onKeyDown = useCallback((e) => {
    handleArrowKeys(e, items, currentIndex, (index) => {
      setCurrentIndex(index);
      onSelect?.(index);
    });
  }, [handleArrowKeys, items, currentIndex, onSelect]);

  return {
    currentIndex,
    setCurrentIndex,
    onKeyDown,
  };
};

/**
 * Screen Reader Hook
 */
export const useScreenReader = () => {
  const { announce } = useAccessibility();

  const announceNavigation = useCallback((destination) => {
    announce(`Navigated to ${destination}`, 'polite');
  }, [announce]);

  const announceAction = useCallback((action) => {
    announce(action, 'assertive');
  }, [announce]);

  const announceError = useCallback((error) => {
    announce(`Error: ${error}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message) => {
    announce(`Success: ${message}`, 'polite');
  }, [announce]);

  const announceLoading = useCallback((isLoading) => {
    announce(isLoading ? 'Loading content' : 'Content loaded', 'polite');
  }, [announce]);

  return {
    announce,
    announceNavigation,
    announceAction,
    announceError,
    announceSuccess,
    announceLoading,
  };
};

export default useAccessibility;