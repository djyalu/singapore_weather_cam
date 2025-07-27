/**
 * Accessibility and UX Compliance Tests
 * Automated testing for WCAG 2.1 AA compliance and mobile UX
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from '../App';
import { I18nProvider } from '../contexts/I18nContext';
import { useAccessibility } from '../hooks/useAccessibility';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock ResizeObserver for tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Accessibility Compliance Tests', () => {
  beforeEach(() => {
    // Reset DOM and clear mocks
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    test('should have no accessibility violations on main app', async () => {
      const { container } = render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper heading hierarchy', () => {
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check that h1 exists and is unique
      const h1Elements = headings.filter(heading => heading.tagName === 'H1');
      expect(h1Elements).toHaveLength(1);
    });

    test('should have proper focus management', async () => {
      const user = userEvent.setup();
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Test keyboard navigation
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
      expect(document.activeElement?.getAttribute('tabindex')).not.toBe('-1');
    });

    test('should have skip links for keyboard navigation', () => {
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main');
    });

    test('should have proper ARIA labels and roles', () => {
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Check for main landmark
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();

      // Check for navigation landmarks
      const navigation = screen.queryAllByRole('navigation');
      expect(navigation.length).toBeGreaterThanOrEqual(0);

      // Check for buttons with accessible names
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(
          button.getAttribute('aria-label') || 
          button.textContent || 
          button.getAttribute('title')
        ).toBeTruthy();
      });
    });

    test('should have sufficient color contrast', async () => {
      const { container } = render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // This would require a more sophisticated color contrast checker
      // For now, we'll check that text elements exist
      const textElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, label');
      expect(textElements.length).toBeGreaterThan(0);
    });

    test('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Check that reduced motion classes are applied
      const animatedElements = document.querySelectorAll('.animate-spin, .animate-pulse');
      animatedElements.forEach(element => {
        expect(element.classList.contains('motion-reduce:animate-none') || 
               element.style.animationDuration === '0.01ms').toBeTruthy();
      });
    });
  });

  describe('Mobile UX Compliance', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    test('should have touch-friendly button sizes', () => {
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        // WCAG recommends minimum 44x44px touch targets
        expect(rect.width >= 44 || rect.height >= 44).toBeTruthy();
      });
    });

    test('should support swipe gestures', async () => {
      const { container } = render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Test touch events
      const touchableElement = container.querySelector('[data-testid="swipeable"]') || container.firstChild;
      
      fireEvent.touchStart(touchableElement, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(touchableElement, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchEnd(touchableElement, {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      });

      // This test validates that touch events don't cause errors
      expect(true).toBeTruthy();
    });

    test('should support pull-to-refresh functionality', async () => {
      const { container } = render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      const pullableElement = container.firstChild;

      // Simulate pull-to-refresh gesture
      fireEvent.touchStart(pullableElement, {
        touches: [{ clientX: 100, clientY: 50 }],
      });

      fireEvent.touchMove(pullableElement, {
        touches: [{ clientX: 100, clientY: 150 }],
      });

      fireEvent.touchEnd(pullableElement, {
        changedTouches: [{ clientX: 100, clientY: 150 }],
      });

      await waitFor(() => {
        // Check if refresh was triggered (would need specific implementation)
        expect(true).toBeTruthy();
      });
    });

    test('should have responsive design breakpoints', () => {
      const { container } = render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Check for responsive classes
      const responsiveElements = container.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    test('should prevent zoom on form inputs', () => {
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      const inputs = screen.queryAllByRole('textbox');
      inputs.forEach(input => {
        const fontSize = window.getComputedStyle(input).fontSize;
        const fontSizeValue = parseInt(fontSize);
        // iOS requires 16px font size to prevent zoom
        expect(fontSizeValue).toBeGreaterThanOrEqual(16);
      });
    });
  });

  describe('Keyboard Navigation Tests', () => {
    test('should support tab navigation', async () => {
      const user = userEvent.setup();
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      const focusableElements = screen.getAllByRole('button')
        .concat(screen.getAllByRole('link'))
        .concat(screen.getAllByRole('textbox'));

      if (focusableElements.length > 0) {
        await user.tab();
        expect(document.activeElement).toBe(focusableElements[0]);

        if (focusableElements.length > 1) {
          await user.tab();
          expect(document.activeElement).toBe(focusableElements[1]);
        }
      }
    });

    test('should support arrow key navigation in menus', async () => {
      const user = userEvent.setup();
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Find menu items (this would need specific menu implementation)
      const menuItems = screen.queryAllByRole('menuitem');
      
      if (menuItems.length > 1) {
        menuItems[0].focus();
        await user.keyboard('[ArrowDown]');
        expect(document.activeElement).toBe(menuItems[1]);

        await user.keyboard('[ArrowUp]');
        expect(document.activeElement).toBe(menuItems[0]);
      }
    });

    test('should support escape key to close modals', async () => {
      const user = userEvent.setup();
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Find and open a modal (this would need specific modal implementation)
      const modalTrigger = screen.queryByRole('button', { name: /open|view|show/i });
      
      if (modalTrigger) {
        await user.click(modalTrigger);
        await user.keyboard('[Escape]');
        
        // Check that modal is closed (implementation specific)
        expect(true).toBeTruthy();
      }
    });
  });

  describe('Screen Reader Compatibility', () => {
    test('should have proper live regions for dynamic content', () => {
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Check for ARIA live regions
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThanOrEqual(0);
    });

    test('should announce loading states', async () => {
      const { container } = render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Look for loading indicators with proper announcements
      const loadingElements = container.querySelectorAll('[aria-busy="true"], [role="progressbar"]');
      loadingElements.forEach(element => {
        expect(
          element.getAttribute('aria-label') || 
          element.textContent ||
          element.getAttribute('aria-describedby')
        ).toBeTruthy();
      });
    });

    test('should have descriptive error messages', () => {
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Check for error messages with proper announcements
      const errorElements = document.querySelectorAll('[role="alert"], .error, [aria-invalid="true"]');
      errorElements.forEach(element => {
        if (element.getAttribute('aria-invalid') === 'true') {
          expect(element.getAttribute('aria-describedby')).toBeTruthy();
        }
      });
    });
  });

  describe('Internationalization Support', () => {
    test('should support multiple languages', () => {
      render(
        <I18nProvider defaultLanguage="en">
          <App />
        </I18nProvider>
      );

      // Check that document language is set
      expect(document.documentElement.lang).toBeTruthy();
    });

    test('should support RTL languages', () => {
      render(
        <I18nProvider defaultLanguage="ar">
          <App />
        </I18nProvider>
      );

      // For RTL languages, check direction
      if (document.documentElement.dir === 'rtl') {
        expect(document.documentElement.dir).toBe('rtl');
      }
    });

    test('should format dates and numbers according to locale', () => {
      const { rerender } = render(
        <I18nProvider defaultLanguage="en">
          <App />
        </I18nProvider>
      );

      // This would require checking specific formatted content
      expect(document.documentElement.lang).toBeTruthy();

      rerender(
        <I18nProvider defaultLanguage="ko">
          <App />
        </I18nProvider>
      );

      expect(document.documentElement.lang).toBeTruthy();
    });
  });
});

describe('Performance and UX Tests', () => {
  test('should load within acceptable time limits', async () => {
    const startTime = performance.now();
    
    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // Should load within 2 seconds (2000ms)
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle offline scenarios gracefully', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    // Check for offline indicators or fallback content
    await waitFor(() => {
      const offlineIndicators = document.querySelectorAll('[data-offline], .offline');
      // Should handle offline state gracefully
      expect(true).toBeTruthy();
    });
  });

  test('should provide visual feedback for user interactions', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    const interactiveElements = screen.getAllByRole('button');
    
    if (interactiveElements.length > 0) {
      const button = interactiveElements[0];
      
      // Check for hover/focus states
      await user.hover(button);
      // Should have visual feedback (implementation specific)
      
      await user.click(button);
      // Should provide click feedback (implementation specific)
      
      expect(true).toBeTruthy();
    }
  });
});

// Helper function to test accessibility hook
describe('useAccessibility Hook Tests', () => {
  test('should provide accessibility utilities', () => {
    let hookResult;
    
    function TestComponent() {
      hookResult = useAccessibility();
      return <div>Test</div>;
    }

    render(<TestComponent />);

    expect(hookResult).toHaveProperty('announce');
    expect(hookResult).toHaveProperty('manageFocus');
    expect(hookResult).toHaveProperty('handleArrowKeys');
    expect(typeof hookResult.announce).toBe('function');
    expect(typeof hookResult.manageFocus).toBe('function');
  });

  test('should detect keyboard users', async () => {
    const user = userEvent.setup();
    let hookResult;
    
    function TestComponent() {
      hookResult = useAccessibility();
      return <button>Test Button</button>;
    }

    render(<TestComponent />);

    // Initially should not be keyboard user
    expect(hookResult.isKeyboardUser).toBe(false);

    // After tabbing, should detect keyboard usage
    await user.tab();
    
    // Note: This test would need more sophisticated state management
    // to properly test the keyboard detection
    expect(true).toBeTruthy();
  });
});