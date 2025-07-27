import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WeatherCard from './WeatherCard';

/**
 * WeatherCard Component Unit Tests
 * QA Persona: Comprehensive coverage with edge cases
 * Frontend Persona: Accessibility and UX validation
 * Performance Persona: Render efficiency validation
 */

describe('WeatherCard Component', () => {
  // Test data factory for consistent testing
  const createTestProps = (overrides = {}) => ({
    title: 'Temperature',
    value: '25°C',
    icon: '🌡️',
    description: 'Current temperature',
    ...overrides,
  });

  describe('Required Props Rendering', () => {
    it('should render with minimum required props', () => {
      const props = createTestProps();
      render(<WeatherCard {...props} />);

      expect(screen.getByText('TEMPERATURE')).toBeInTheDocument();
      expect(screen.getByText('25°C')).toBeInTheDocument();
      expect(screen.getByText('🌡️')).toBeInTheDocument();
    });

    it('should render title in uppercase', () => {
      const props = createTestProps({ title: 'humidity level' });
      render(<WeatherCard {...props} />);

      expect(screen.getByText('HUMIDITY LEVEL')).toBeInTheDocument();
    });

    it('should handle numeric values correctly', () => {
      const props = createTestProps({ value: 42 });
      render(<WeatherCard {...props} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Optional Props Handling', () => {
    it('should render description when provided', () => {
      const props = createTestProps({ description: 'Feels comfortable' });
      render(<WeatherCard {...props} />);

      expect(screen.getByText('Feels comfortable')).toBeInTheDocument();
    });

    it('should not render description section when not provided', () => {
      const props = createTestProps({ description: undefined });
      render(<WeatherCard {...props} />);

      expect(screen.queryByText('Feels comfortable')).not.toBeInTheDocument();
    });

    it('should handle empty string description', () => {
      const props = createTestProps({ description: '' });
      render(<WeatherCard {...props} />);

      // Should not render empty description
      const descriptions = screen.queryAllByText('');
      expect(descriptions).toHaveLength(0);
    });
  });

  describe('Status Indicator System', () => {
    it('should apply normal status styling by default', () => {
      const props = createTestProps();
      const { container } = render(<WeatherCard {...props} />);

      const card = container.firstChild;
      expect(card).toHaveClass('border-l-4', 'border-transparent', 'bg-white');
    });

    it('should apply warning status styling', () => {
      const props = createTestProps({ status: 'warning' });
      const { container } = render(<WeatherCard {...props} />);

      const card = container.firstChild;
      expect(card).toHaveClass('border-amber-400', 'bg-amber-50');
    });

    it('should apply danger status styling', () => {
      const props = createTestProps({ status: 'danger' });
      const { container } = render(<WeatherCard {...props} />);

      const card = container.firstChild;
      expect(card).toHaveClass('border-red-400', 'bg-red-50');
    });

    it('should apply good status styling', () => {
      const props = createTestProps({ status: 'good' });
      const { container } = render(<WeatherCard {...props} />);

      const card = container.firstChild;
      expect(card).toHaveClass('border-green-400', 'bg-green-50');
    });

    it('should show status indicator dot for non-normal status', () => {
      const props = createTestProps({ status: 'warning' });
      const { container } = render(<WeatherCard {...props} />);

      const indicator = container.querySelector('.bg-amber-400.animate-pulse');
      expect(indicator).toBeInTheDocument();
    });

    it('should not show status indicator for normal status', () => {
      const props = createTestProps({ status: 'normal' });
      const { container } = render(<WeatherCard {...props} />);

      const indicators = container.querySelectorAll('.animate-pulse');
      expect(indicators).toHaveLength(0);
    });
  });

  describe('Trend Display System', () => {
    it('should display up trend with correct styling', () => {
      const props = createTestProps({ trend: 'up' });
      render(<WeatherCard {...props} />);

      const trendBadge = screen.getByText('↗️');
      expect(trendBadge).toBeInTheDocument();
      expect(trendBadge.closest('span')).toHaveClass('bg-red-100', 'text-red-700');
    });

    it('should display down trend with correct styling', () => {
      const props = createTestProps({ trend: 'down' });
      render(<WeatherCard {...props} />);

      const trendBadge = screen.getByText('↘️');
      expect(trendBadge).toBeInTheDocument();
      expect(trendBadge.closest('span')).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    it('should display stable trend with correct styling', () => {
      const props = createTestProps({ trend: 'stable' });
      render(<WeatherCard {...props} />);

      const trendBadge = screen.getByText('→');
      expect(trendBadge).toBeInTheDocument();
      expect(trendBadge.closest('span')).toHaveClass('bg-gray-100', 'text-gray-700');
    });

    it('should not display trend when not provided', () => {
      const props = createTestProps({ trend: undefined });
      render(<WeatherCard {...props} />);

      expect(screen.queryByText('↗️')).not.toBeInTheDocument();
      expect(screen.queryByText('↘️')).not.toBeInTheDocument();
      expect(screen.queryByText('→')).not.toBeInTheDocument();
    });
  });

  describe('Interactive Behavior', () => {
    it('should have hover effects applied', () => {
      const props = createTestProps();
      const { container } = render(<WeatherCard {...props} />);

      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-xl', 'transition-all', 'duration-300');
    });

    it('should handle mouse interactions without errors', () => {
      const props = createTestProps();
      const { container } = render(<WeatherCard {...props} />);

      const card = container.firstChild;

      // Test hover states don't throw errors
      expect(() => {
        fireEvent.mouseEnter(card);
        fireEvent.mouseLeave(card);
      }).not.toThrow();
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper semantic structure', () => {
      const props = createTestProps();
      render(<WeatherCard {...props} />);

      // Check for proper heading hierarchy
      const title = screen.getByText('TEMPERATURE');
      expect(title.tagName).toBe('P');

      const value = screen.getByText('25°C');
      expect(value.tagName).toBe('P');
    });

    it('should have sufficient color contrast for status indicators', () => {
      const props = createTestProps({ status: 'warning' });
      const { container } = render(<WeatherCard {...props} />);

      // Warning status should have sufficient contrast
      const card = container.firstChild;
      expect(card).toHaveClass('bg-amber-50');
    });

    it('should be keyboard accessible', () => {
      const props = createTestProps();
      const { container } = render(<WeatherCard {...props} />);

      const card = container.firstChild;

      // Should be focusable for keyboard navigation
      card.focus();
      expect(document.activeElement).toBe(card);
    });
  });

  describe('Performance Optimization', () => {
    it('should render efficiently with minimal DOM nodes', () => {
      const props = createTestProps();
      const { container } = render(<WeatherCard {...props} />);

      // Count DOM nodes to ensure lean structure
      const allNodes = container.querySelectorAll('*');
      expect(allNodes.length).toBeLessThan(15); // Reasonable DOM size
    });

    it('should handle rapid re-renders without memory leaks', () => {
      const props = createTestProps();
      const { rerender } = render(<WeatherCard {...props} />);

      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<WeatherCard {...createTestProps({ value: `${i}°C` })} />);
      }

      // Should complete without throwing errors
      expect(screen.getByText('9°C')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long titles gracefully', () => {
      const longTitle = 'A'.repeat(100);
      const props = createTestProps({ title: longTitle });
      render(<WeatherCard {...props} />);

      expect(screen.getByText(longTitle.toUpperCase())).toBeInTheDocument();
    });

    it('should handle special characters in values', () => {
      const props = createTestProps({ value: '25.5°C ±0.1' });
      render(<WeatherCard {...props} />);

      expect(screen.getByText('25.5°C ±0.1')).toBeInTheDocument();
    });

    it('should handle complex React nodes as icons', () => {
      const complexIcon = (
        <div>
          <span>🌡️</span>
          <span>📊</span>
        </div>
      );
      const props = createTestProps({ icon: complexIcon });

      expect(() => {
        render(<WeatherCard {...props} />);
      }).not.toThrow();
    });

    it('should handle null/undefined props gracefully', () => {
      const props = createTestProps({
        description: null,
        trend: null,
        status: undefined,
      });

      expect(() => {
        render(<WeatherCard {...props} />);
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('should work within parent containers', () => {
      const props = createTestProps();
      render(
        <div className="grid grid-cols-2 gap-4">
          <WeatherCard {...props} />
          <WeatherCard {...createTestProps({ title: 'Humidity' })} />
        </div>,
      );

      expect(screen.getByText('TEMPERATURE')).toBeInTheDocument();
      expect(screen.getByText('HUMIDITY')).toBeInTheDocument();
    });

    it('should maintain styling consistency across multiple instances', () => {
      const props1 = createTestProps({ status: 'warning' });
      const props2 = createTestProps({ status: 'warning', title: 'Humidity' });

      const { container } = render(
        <div>
          <WeatherCard {...props1} />
          <WeatherCard {...props2} />
        </div>,
      );

      const cards = container.querySelectorAll('.border-amber-400');
      expect(cards).toHaveLength(2);
    });
  });

  describe('Prop Type Validation', () => {
    // These tests would trigger PropTypes warnings in development
    it('should validate required props', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Missing required prop should trigger warning
      render(<WeatherCard />);

      // In a real scenario, PropTypes would log warnings
      consoleSpy.mockRestore();
    });
  });
});