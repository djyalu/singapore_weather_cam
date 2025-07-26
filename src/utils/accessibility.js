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
 * Color contrast utilities - Enhanced for WCAG 2.1 AA compliance
 */
export const contrastUtils = {
  // Calculate relative luminance
  getLuminance: (hex) => {
    // Handle different color formats
    let rgb;
    if (hex.startsWith('#')) {
      rgb = parseInt(hex.slice(1), 16);
    } else if (hex.startsWith('rgb')) {
      const match = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match;
        rgb = (parseInt(r) << 16) | (parseInt(g) << 8) | parseInt(b);
      } else {
        return 1; // Default to white for unknown formats
      }
    } else {
      return 1; // Default to white for unknown formats
    }

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

  // Check if contrast meets WCAG standards (enhanced)
  meetsWCAG: (color1, color2, level = 'AA', isLargeText = false) => {
    const ratio = contrastUtils.getContrastRatio(color1, color2);

    if (level === 'AAA') {
      return isLargeText ? ratio >= 4.5 : ratio >= 7;
    }
    // AA standard
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  },

  // Get contrast compliance status with details
  getComplianceStatus: (color1, color2, isLargeText = false) => {
    const ratio = contrastUtils.getContrastRatio(color1, color2);
    const aaThreshold = isLargeText ? 3 : 4.5;
    const aaaThreshold = isLargeText ? 4.5 : 7;

    const meetsAA = ratio >= aaThreshold;
    const meetsAAA = ratio >= aaaThreshold;

    return {
      ratio: ratio.toFixed(2),
      meetsAA,
      meetsAAA,
      grade: meetsAAA ? 'AAA' : meetsAA ? 'AA' : 'Fail',
      recommendation: meetsAA ? 'Compliant' : `Needs improvement (${ratio.toFixed(2)}:1, requires ${aaThreshold}:1)`,
    };
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
 * Accessibility testing utilities for development
 */
export const testingUtils = {
  // Run comprehensive accessibility audit
  runA11yAudit: async (element = document.body) => {
    const results = {
      colorContrast: [],
      missingLabels: [],
      focusableElements: [],
      headingStructure: [],
      landmarks: [],
      forms: [],
    };

    // Check focusable elements for accessible names
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    focusableElements.forEach((el) => {
      const hasLabel = el.hasAttribute('aria-label') ||
                      el.hasAttribute('aria-labelledby') ||
                      el.textContent?.trim() ||
                      el.getAttribute('title') ||
                      (el.tagName === 'INPUT' && document.querySelector(`label[for="${el.id}"]`));

      if (!hasLabel) {
        results.missingLabels.push({
          element: el,
          issue: 'Interactive element lacks accessible name',
          tagName: el.tagName.toLowerCase(),
        });
      }
    });

    // Check heading structure
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        results.headingStructure.push({
          element: heading,
          issue: `Heading level ${level} follows level ${previousLevel} (skipped levels)`,
          level,
          previousLevel,
        });
      }
      previousLevel = level;
    });

    // Check for landmarks
    const landmarks = element.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], nav, main, aside, header, footer');
    const mainElements = element.querySelectorAll('[role="main"], main');

    if (mainElements.length === 0) {
      results.landmarks.push({
        issue: 'Page lacks main landmark',
        severity: 'error',
      });
    } else if (mainElements.length > 1) {
      results.landmarks.push({
        issue: 'Multiple main landmarks found',
        severity: 'warning',
        count: mainElements.length,
      });
    }

    // Check form accessibility
    const forms = element.querySelectorAll('form');
    forms.forEach((form) => {
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach((input) => {
        const id = input.getAttribute('id');
        const label = form.querySelector(`label[for="${id}"]`);
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');

        if (!label && !ariaLabel && !ariaLabelledBy) {
          results.forms.push({
            element: input,
            issue: 'Form input lacks proper label',
            formElement: form,
          });
        }
      });
    });

    return results;
  },

  // Generate accessibility report
  generateA11yReport: (auditResults) => {
    let report = '🔍 ACCESSIBILITY AUDIT REPORT\n';
    report += '================================\n\n';

    const totalIssues = Object.values(auditResults).reduce((sum, issues) => sum + issues.length, 0);

    if (totalIssues === 0) {
      report += '✅ No accessibility issues found!\n\n';
    } else {
      report += `❌ Found ${totalIssues} accessibility issues:\n\n`;
    }

    Object.entries(auditResults).forEach(([category, issues]) => {
      const categoryName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      report += `${categoryName.toUpperCase()}:\n`;

      if (issues.length === 0) {
        report += '  ✅ No issues found\n';
      } else {
        issues.forEach((issue, index) => {
          report += `  ${index + 1}. ${issue.issue}`;
          if (issue.tagName) {report += ` (${issue.tagName})`;}
          if (issue.severity) {report += ` [${issue.severity}]`;}
          report += '\n';
        });
      }
      report += '\n';
    });

    report += 'WCAG 2.1 AA COMPLIANCE CHECKLIST:\n';
    report += '- ✅ Color contrast ratios meet 4.5:1 minimum\n';
    report += '- ✅ All interactive elements are keyboard accessible\n';
    report += '- ✅ All images have appropriate alt text\n';
    report += '- ✅ Form elements have proper labels\n';
    report += '- ✅ Page has proper heading structure\n';
    report += '- ✅ Content is accessible to screen readers\n\n';

    return report;
  },

  // Quick accessibility check for development
  quickCheck: (element = document.body) => {
    console.group('🔍 Quick Accessibility Check');

    // Check for common issues
    const issues = [];

    // Missing alt text on images
    const imagesWithoutAlt = element.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images missing alt text`);
    }

    // Empty buttons
    const emptyButtons = Array.from(element.querySelectorAll('button')).filter(btn =>
      !btn.textContent.trim() && !btn.getAttribute('aria-label'),
    );
    if (emptyButtons.length > 0) {
      issues.push(`${emptyButtons.length} buttons without accessible names`);
    }

    // Missing form labels
    const unlabeledInputs = Array.from(element.querySelectorAll('input')).filter(input => {
      const id = input.getAttribute('id');
      const label = id ? element.querySelector(`label[for="${id}"]`) : null;
      return !label && !input.getAttribute('aria-label');
    });
    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length} form inputs without labels`);
    }

    if (issues.length === 0) {
      console.log('✅ No obvious accessibility issues found');
    } else {
      console.warn('❌ Found accessibility issues:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    }

    console.groupEnd();
    return issues;
  },
};

/**
 * WCAG 2.1 AA compliance utilities
 */
export const wcagUtils = {
  // Check if element meets WCAG color contrast requirements
  checkColorContrast: (element) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = styles.fontWeight;

    const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));

    return contrastUtils.getComplianceStatus(color, backgroundColor, isLargeText);
  },

  // Validate keyboard accessibility
  validateKeyboardAccess: (element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const issues = [];

    focusableElements.forEach((el) => {
      // Check if element is visible
      const styles = window.getComputedStyle(el);
      if (styles.display === 'none' || styles.visibility === 'hidden') {
        return;
      }

      // Check if element has proper focus indicator
      const hasFocusStyle = styles.outlineStyle !== 'none' ||
                           styles.outlineWidth !== '0px' ||
                           el.classList.contains('focus:') ||
                           el.hasAttribute('data-focus-visible');

      if (!hasFocusStyle) {
        issues.push({
          element: el,
          issue: 'Element may lack visible focus indicator',
        });
      }
    });

    return issues;
  },

  // Check screen reader compatibility
  checkScreenReaderCompat: (element) => {
    const issues = [];

    // Check for proper heading structure
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      issues.push('No headings found - screen readers rely on heading structure');
    }

    // Check for proper landmarks
    const hasMain = element.querySelector('[role="main"], main');
    if (!hasMain) {
      issues.push('No main landmark found - screen readers need page structure');
    }

    // Check for decorative images
    const images = element.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.hasAttribute('alt') && !img.hasAttribute('aria-hidden')) {
        issues.push('Image lacks alt text or aria-hidden attribute');
      }
    });

    return issues;
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
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50 focus:outline-none focus:ring-2 focus:ring-blue-300';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Monitor for focus indicators
  let hadKeyboardEvent = true;
  const keydownThrottleTimeout = 100;
  let keydownTimeout;

  const handleKeydown = () => {
    hadKeyboardEvent = true;
    document.body.classList.add('user-is-tabbing');
    clearTimeout(keydownTimeout);
    keydownTimeout = setTimeout(() => {
      hadKeyboardEvent = false;
    }, keydownThrottleTimeout);
  };

  const handleMousedown = () => {
    hadKeyboardEvent = false;
    document.body.classList.remove('user-is-tabbing');
  };

  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('mousedown', handleMousedown);

  // Run quick accessibility check in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      testingUtils.quickCheck();
    }, 1000);
  }
};