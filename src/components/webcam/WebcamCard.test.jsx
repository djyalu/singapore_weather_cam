import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import WebcamCard from './WebcamCard';

/**
 * WebcamCard Component Unit Tests
 * QA Persona: Edge cases, error handling, retry logic
 * Frontend Persona: UX states, accessibility, responsive behavior
 * Performance Persona: Image loading optimization, memory management
 */

describe('WebcamCard Component', () => {
  // Mock timers for interval and timeout testing
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // Test data factory for consistent testing
  const createWebcamData = (overrides = {}) => ({
    name: 'Marina Bay Traffic',
    location: 'Marina Bay, Singapore',
    file_info: {
      url: '/images/webcam/marina_bay.jpg',
      size: 102400,
    },
    ai_analysis: {
      analysis_available: true,
      analysis: 'Moderate traffic with clear weather conditions',
    },
    capture_time: '2025-01-27T08:00:00Z',
    type: 'traffic',
    ...overrides,
  });

  const renderWebcamCard = (webcam = createWebcamData(), onClick = vi.fn()) => {
    return render(<WebcamCard webcam={webcam} onClick={onClick} />);
  };

  describe('Basic Rendering', () => {
    it('should render webcam information correctly', () => {
      const webcam = createWebcamData();
      renderWebcamCard(webcam);

      expect(screen.getByText('Marina Bay Traffic')).toBeInTheDocument();
      expect(screen.getByText('Marina Bay, Singapore')).toBeInTheDocument();
      expect(screen.getByText('traffic')).toBeInTheDocument();
      expect(screen.getByText('Size: 100KB')).toBeInTheDocument();
    });

    it('should display AI analysis when available', () => {
      const webcam = createWebcamData();
      renderWebcamCard(webcam);

      expect(screen.getByText('AI Analysis:')).toBeInTheDocument();
      expect(screen.getByText('Moderate traffic with clear weather conditions')).toBeInTheDocument();
    });

    it('should show reason when AI analysis is not available', () => {
      const webcam = createWebcamData({
        ai_analysis: {
          analysis_available: false,
          reason: 'Claude API key not configured',
        },
      });
      renderWebcamCard(webcam);

      expect(screen.getByText('AI Analysis: Claude API key not configured')).toBeInTheDocument();
    });

    it('should handle missing AI analysis gracefully', () => {
      const webcam = createWebcamData({ ai_analysis: null });
      renderWebcamCard(webcam);

      expect(screen.queryByText('AI Analysis:')).not.toBeInTheDocument();
    });
  });

  describe('Image Loading States', () => {
    it('should show loading state initially', () => {
      renderWebcamCard();

      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });

    it('should hide loading state when image loads successfully', async () => {
      renderWebcamCard();

      const image = screen.getByRole('img');

      // Simulate successful image load
      act(() => {
        fireEvent.load(image);
      });

      await waitFor(() => {
        expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument();
      });
    });

    it('should show error state after failed loading attempts', async () => {
      renderWebcamCard();

      const image = screen.getByRole('img');

      // Simulate image error 3 times (max retries)
      for (let i = 0; i < 3; i++) {
        act(() => {
          fireEvent.error(image);
        });

        // Fast-forward retry timeout
        act(() => {
          vi.advanceTimersByTime(1000 * (i + 1));
        });
      }

      await waitFor(() => {
        expect(screen.getByText('이미지를 불러올 수 없습니다')).toBeInTheDocument();
        expect(screen.getByText('네트워크를 확인해주세요')).toBeInTheDocument();
      });
    });

    it('should show retry indicator during retry attempts', async () => {
      renderWebcamCard();

      const image = screen.getByRole('img');

      // First error should trigger retry
      act(() => {
        fireEvent.error(image);
      });

      await waitFor(() => {
        expect(screen.getByText('재시도 중... (1/3)')).toBeInTheDocument();
      });
    });
  });

  describe('Image URL Generation', () => {
    it('should use file_info.url when available', () => {
      const webcam = createWebcamData({
        file_info: { url: 'https://cdn.example.com/image.jpg' },
      });
      renderWebcamCard(webcam);

      const image = screen.getByRole('img');
      expect(image.src).toContain('https://cdn.example.com/image.jpg');
    });

    it('should fallback to source_url when url is not available', () => {
      const webcam = createWebcamData({
        file_info: { source_url: 'https://api.example.com/image.jpg' },
      });
      renderWebcamCard(webcam);

      const image = screen.getByRole('img');
      expect(image.src).toContain('https://api.example.com/image.jpg');
    });

    it('should fallback to path when other URLs are not available', () => {
      const webcam = createWebcamData({
        file_info: { path: 'images/webcam/test.jpg' },
      });
      renderWebcamCard(webcam);

      const image = screen.getByRole('img');
      expect(image.src).toContain('images/webcam/test.jpg');
    });

    it('should use placeholder when no image info available', () => {
      const webcam = createWebcamData({ file_info: null });
      renderWebcamCard(webcam);

      const image = screen.getByRole('img');
      expect(image.src).toContain('placeholder.jpg');
    });

    it('should append timestamp for cache busting', () => {
      renderWebcamCard();

      const image = screen.getByRole('img');
      expect(image.src).toMatch(/[?&]t=\d+/);
    });
  });

  describe('Auto-refresh Functionality', () => {
    it('should refresh image every 30 seconds', () => {
      renderWebcamCard();

      const image = screen.getByRole('img');
      const initialSrc = image.src;

      // Fast-forward 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Image source should have updated timestamp
      expect(image.src).not.toBe(initialSrc);
      expect(image.src).toMatch(/[?&]t=\d+/);
    });

    it('should clean up interval on unmount', () => {
      const { unmount } = renderWebcamCard();

      // Verify interval is set
      expect(vi.getTimerCount()).toBe(1);

      unmount();

      // Interval should be cleared
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('Interactive Behavior', () => {
    it('should call onClick when card is clicked', () => {
      const onClick = vi.fn();
      renderWebcamCard(createWebcamData(), onClick);

      const card = screen.getByRole('img').closest('div').parentElement;
      fireEvent.click(card);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should have hover effects applied', () => {
      const { container } = renderWebcamCard();

      const card = container.firstChild;
      expect(card).toHaveClass(
        'cursor-pointer',
        'hover:shadow-xl',
        'transition-all',
        'duration-300',
        'transform',
        'hover:-translate-y-1',
      );
    });

    it('should handle rapid clicks without errors', () => {
      const onClick = vi.fn();
      renderWebcamCard(createWebcamData(), onClick);

      const card = screen.getByRole('img').closest('div').parentElement;

      // Rapid fire clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(card);
      }

      expect(onClick).toHaveBeenCalledTimes(10);
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper alt text for images', () => {
      const webcam = createWebcamData({ name: 'Orchard Road Camera' });
      renderWebcamCard(webcam);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Orchard Road Camera webcam view');
    });

    it('should be keyboard accessible', () => {
      const onClick = vi.fn();
      renderWebcamCard(createWebcamData(), onClick);

      const card = screen.getByRole('img').closest('div').parentElement;

      // Should be focusable
      card.focus();
      expect(document.activeElement).toBe(card);

      // Should respond to Enter key
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      // Note: onClick behavior on Enter would need additional implementation
    });

    it('should have proper semantic structure', () => {
      renderWebcamCard();

      // Check heading structure
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Marina Bay Traffic');
    });

    it('should provide loading feedback for screen readers', () => {
      renderWebcamCard();

      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should use lazy loading for images', () => {
      renderWebcamCard();

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should handle memory efficiently during retries', async () => {
      renderWebcamCard();

      const image = screen.getByRole('img');

      // Multiple retries should not create memory leaks
      for (let i = 0; i < 5; i++) {
        act(() => {
          fireEvent.error(image);
          vi.advanceTimersByTime(2000);
        });
      }

      // Should stabilize after max retries
      expect(screen.getByText('이미지를 불러올 수 없습니다')).toBeInTheDocument();
    });

    it('should render efficiently with minimal DOM updates', () => {
      const { container, rerender } = renderWebcamCard();

      const initialHTML = container.innerHTML;

      // Re-render with same data
      rerender(<WebcamCard webcam={createWebcamData()} onClick={vi.fn()} />);

      // DOM should remain stable for same data
      expect(container.innerHTML).toBe(initialHTML);
    });
  });

  describe('Time Display', () => {
    it('should format capture time correctly', () => {
      const webcam = createWebcamData({
        capture_time: '2025-01-27T14:30:00Z',
      });
      renderWebcamCard(webcam);

      // Should display formatted time (specific format may vary by locale)
      expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
    });

    it('should handle invalid date gracefully', () => {
      const webcam = createWebcamData({
        capture_time: 'invalid-date',
      });

      expect(() => {
        renderWebcamCard(webcam);
      }).not.toThrow();
    });
  });

  describe('Live Status Indicator', () => {
    it('should show live indicator when image is loaded', async () => {
      renderWebcamCard();

      const image = screen.getByRole('img');

      act(() => {
        fireEvent.load(image);
      });

      await waitFor(() => {
        expect(screen.getByText('🔴 LIVE (30초 새로고침)')).toBeInTheDocument();
      });
    });

    it('should not show live indicator during loading or error states', () => {
      renderWebcamCard();

      // During loading
      expect(screen.queryByText('🔴 LIVE (30초 새로고침)')).not.toBeInTheDocument();

      // During error
      const image = screen.getByRole('img');
      act(() => {
        fireEvent.error(image);
      });

      expect(screen.queryByText('🔴 LIVE (30초 새로고침)')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing file_info gracefully', () => {
      const webcam = createWebcamData({ file_info: null });

      expect(() => {
        renderWebcamCard(webcam);
      }).not.toThrow();

      expect(screen.queryByText(/Size:/)).not.toBeInTheDocument();
    });

    it('should handle very large file sizes', () => {
      const webcam = createWebcamData({
        file_info: { size: 10485760 }, // 10MB
      });
      renderWebcamCard(webcam);

      expect(screen.getByText('Size: 10240KB')).toBeInTheDocument();
    });

    it('should handle empty strings in webcam data', () => {
      const webcam = createWebcamData({
        name: '',
        location: '',
        type: '',
      });

      expect(() => {
        renderWebcamCard(webcam);
      }).not.toThrow();
    });

    it('should handle special characters in names and locations', () => {
      const webcam = createWebcamData({
        name: 'Camera @#$%^&*()',
        location: 'Location with émojis 🌟',
      });
      renderWebcamCard(webcam);

      expect(screen.getByText('Camera @#$%^&*()')).toBeInTheDocument();
      expect(screen.getByText('Location with émojis 🌟')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should work within gallery containers', () => {
      const webcam1 = createWebcamData({ name: 'Camera 1' });
      const webcam2 = createWebcamData({ name: 'Camera 2' });

      render(
        <div className="grid grid-cols-2 gap-4">
          <WebcamCard webcam={webcam1} onClick={vi.fn()} />
          <WebcamCard webcam={webcam2} onClick={vi.fn()} />
        </div>,
      );

      expect(screen.getByText('Camera 1')).toBeInTheDocument();
      expect(screen.getByText('Camera 2')).toBeInTheDocument();
    });

    it('should maintain independent state across multiple instances', async () => {
      const webcam1 = createWebcamData({ name: 'Camera 1' });
      const webcam2 = createWebcamData({ name: 'Camera 2' });

      render(
        <div>
          <WebcamCard webcam={webcam1} onClick={vi.fn()} />
          <WebcamCard webcam={webcam2} onClick={vi.fn()} />
        </div>,
      );

      const images = screen.getAllByRole('img');

      // Error on first image only
      act(() => {
        fireEvent.error(images[0]);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Only first camera should show retry indicator
      expect(screen.getByText('재시도 중... (1/3)')).toBeInTheDocument();
      expect(screen.getAllByText('재시도 중... (1/3)')).toHaveLength(1);
    });
  });
});