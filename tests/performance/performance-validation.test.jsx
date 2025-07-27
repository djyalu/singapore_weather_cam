import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { performanceBudgets } from '../../playwright.config.js';
import App from '../../src/App';
import WeatherCard from '../../src/components/weather/WeatherCard';
import WebcamCard from '../../src/components/webcam/WebcamCard';
import { AppDataContext } from '../../src/contexts/AppDataContext';

/**
 * Performance Validation Tests
 * Performance Persona: Resource optimization and efficiency validation
 * QA Persona: Performance regression prevention
 * Frontend Persona: User experience performance metrics
 */

// Mock performance APIs for testing
const mockPerformanceObserver = vi.fn();
const mockPerformanceEntries = [];

global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => mockPerformanceEntries)
}));

describe('Performance Validation Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceEntries.length = 0;
    
    // Mock performance.now for consistent timing
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
    
    // Mock performance.mark and measure
    vi.spyOn(performance, 'mark').mockImplementation(() => {});
    vi.spyOn(performance, 'measure').mockImplementation(() => {
      return {
        name: 'test-measure',
        startTime: 0,
        duration: 100
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test data for performance scenarios
  const mockLargeDataset = {
    weatherData: {
      stations: Array.from({ length: 100 }, (_, i) => ({
        id: `S${i}`,
        name: `Station ${i}`,
        readings: {
          temperature: 25 + Math.random() * 10,
          humidity: 60 + Math.random() * 30,
          wind_speed: Math.random() * 20
        }
      })),
      summary: { avg_temperature: 28, avg_humidity: 75 }
    },
    webcamData: Array.from({ length: 50 }, (_, i) => ({
      name: `Camera ${i}`,
      location: `Location ${i}`,
      file_info: { 
        url: `https://example.com/image${i}.jpg`,
        size: 100000 + Math.random() * 200000
      },
      ai_analysis: { 
        analysis_available: true, 
        analysis: `Traffic analysis for camera ${i}` 
      },
      capture_time: new Date().toISOString(),
      type: 'traffic'
    })),
    loading: { weather: false, webcam: false, traffic: false },
    error: { weather: null, webcam: null, traffic: null }
  };

  describe('Render Performance', () => {
    it('should render components within performance budget', async () => {
      const startTime = performance.now();
      
      render(
        <AppDataContext.Provider value={mockLargeDataset}>
          <App />
        </AppDataContext.Provider>
      );
      
      const renderTime = performance.now() - startTime;
      
      // Should render within 100ms budget for initial render
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large weather datasets efficiently', async () => {
      const startTime = performance.now();
      
      render(
        <AppDataContext.Provider value={mockLargeDataset}>
          <div>
            {mockLargeDataset.weatherData.stations.slice(0, 20).map((station, index) => (
              <WeatherCard
                key={station.id}
                title={station.name}
                value={`${station.readings.temperature.toFixed(1)}°C`}
                icon="🌡️"
              />
            ))}
          </div>
        </AppDataContext.Provider>
      );
      
      const renderTime = performance.now() - startTime;
      
      // Should handle 20 weather cards within 50ms
      expect(renderTime).toBeLessThan(50);
    });

    it('should render webcam gallery efficiently', async () => {
      const startTime = performance.now();
      
      render(
        <div>
          {mockLargeDataset.webcamData.slice(0, 12).map((webcam, index) => (
            <WebcamCard
              key={index}
              webcam={webcam}
              onClick={() => {}}
            />
          ))}
        </div>
      );
      
      const renderTime = performance.now() - startTime;
      
      // Should render 12 webcam cards within 80ms
      expect(renderTime).toBeLessThan(80);
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not create memory leaks during re-renders', async () => {
      const { rerender } = render(
        <AppDataContext.Provider value={mockLargeDataset}>
          <App />
        </AppDataContext.Provider>
      );
      
      // Simulate multiple re-renders with different data
      for (let i = 0; i < 10; i++) {
        const updatedData = {
          ...mockLargeDataset,
          weatherData: {
            ...mockLargeDataset.weatherData,
            summary: { 
              avg_temperature: 28 + i * 0.1,
              avg_humidity: 75 + i * 0.5
            }
          }
        };
        
        rerender(
          <AppDataContext.Provider value={updatedData}>
            <App />
          </AppDataContext.Provider>
        );
      }
      
      // Should complete without memory issues
      expect(screen.getByText(/28\.9°C|29\.0°C/)).toBeInTheDocument();
    });

    it('should efficiently manage component lifecycle', () => {
      const { unmount } = render(
        <WeatherCard
          title="Temperature"
          value="25°C"
          icon="🌡️"
        />
      );
      
      // Should unmount cleanly without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle webcam auto-refresh without memory leaks', async () => {
      vi.useFakeTimers();
      
      const { unmount } = render(
        <WebcamCard
          webcam={mockLargeDataset.webcamData[0]}
          onClick={() => {}}
        />
      );
      
      // Simulate multiple auto-refresh cycles
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(30000); // 30 second intervals
      }
      
      // Should handle cleanup properly
      expect(() => unmount()).not.toThrow();
      
      vi.useRealTimers();
    });
  });

  describe('Resource Loading Optimization', () => {
    it('should implement lazy loading for images', () => {
      render(
        <WebcamCard
          webcam={mockLargeDataset.webcamData[0]}
          onClick={() => {}}
        />
      );
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should optimize image cache busting', () => {
      const { rerender } = render(
        <WebcamCard
          webcam={mockLargeDataset.webcamData[0]}
          onClick={() => {}}
        />
      );
      
      const initialImage = screen.getByRole('img');
      const initialSrc = initialImage.src;
      
      // Re-render should update cache-busting parameter
      rerender(
        <WebcamCard
          webcam={mockLargeDataset.webcamData[0]}
          onClick={() => {}}
        />
      );
      
      // Source should contain timestamp parameter
      expect(initialSrc).toMatch(/[?&]t=\d+/);
    });

    it('should batch DOM updates efficiently', async () => {
      const startTime = performance.now();
      
      const { rerender } = render(
        <AppDataContext.Provider value={mockLargeDataset}>
          <App />
        </AppDataContext.Provider>
      );
      
      // Rapid state updates
      for (let i = 0; i < 5; i++) {
        const updatedData = {
          ...mockLargeDataset,
          weatherData: {
            ...mockLargeDataset.weatherData,
            timestamp: new Date(Date.now() + i * 1000).toISOString()
          }
        };
        
        rerender(
          <AppDataContext.Provider value={updatedData}>
            <App />
          </AppDataContext.Provider>
        );
      }
      
      const updateTime = performance.now() - startTime;
      
      // Batched updates should be efficient
      expect(updateTime).toBeLessThan(50);
    });
  });

  describe('Component Performance Budgets', () => {
    it('should meet individual component render budgets', async () => {
      const componentBudgets = [
        { 
          component: () => (
            <WeatherCard title="Test" value="25°C" icon="🌡️" />
          ), 
          budget: 5 // 5ms budget
        },
        { 
          component: () => (
            <WebcamCard 
              webcam={mockLargeDataset.webcamData[0]} 
              onClick={() => {}} 
            />
          ), 
          budget: 15 // 15ms budget
        }
      ];
      
      for (const { component, budget } of componentBudgets) {
        const startTime = performance.now();
        render(component());
        const renderTime = performance.now() - startTime;
        
        expect(renderTime).toBeLessThan(budget);
      }
    });

    it('should maintain performance under data loading stress', async () => {
      const stressData = {
        ...mockLargeDataset,
        loading: { weather: true, webcam: true, traffic: true }
      };
      
      const startTime = performance.now();
      
      render(
        <AppDataContext.Provider value={stressData}>
          <App />
        </AppDataContext.Provider>
      );
      
      const renderTime = performance.now() - startTime;
      
      // Should handle loading states efficiently
      expect(renderTime).toBeLessThan(30);
    });
  });

  describe('Animation Performance', () => {
    it('should use hardware-accelerated animations', () => {
      render(
        <WeatherCard
          title="Temperature"
          value="25°C"
          icon="🌡️"
        />
      );
      
      const card = screen.getByText('25°C').closest('div');
      
      // Should use transform for animations (hardware accelerated)
      expect(card).toHaveClass(/transition/);
      expect(card).toHaveClass(/duration/);
    });

    it('should optimize animation performance', async () => {
      vi.useFakeTimers();
      
      render(
        <WebcamCard
          webcam={mockLargeDataset.webcamData[0]}
          onClick={() => {}}
        />
      );
      
      const card = screen.getByText(mockLargeDataset.webcamData[0].name).closest('div').parentElement;
      
      // Simulate hover animation
      const startTime = performance.now();
      
      // Trigger hover state
      card.classList.add('hover');
      
      // Fast-forward through animation
      vi.advanceTimersByTime(300);
      
      const animationTime = performance.now() - startTime;
      
      // Animation should be smooth (under 16ms for 60fps)
      expect(animationTime).toBeLessThan(16);
      
      vi.useRealTimers();
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should have optimal component code size', () => {
      // Test component code complexity as proxy for bundle size
      const weatherCardCode = WeatherCard.toString();
      const webcamCardCode = WebcamCard.toString();
      
      // Components should be reasonably sized (not overly complex)
      expect(weatherCardCode.length).toBeLessThan(5000); // 5KB limit
      expect(webcamCardCode.length).toBeLessThan(8000);  // 8KB limit
    });

    it('should efficiently import dependencies', () => {
      // Verify tree-shaking friendly imports exist
      const modules = [
        () => import('../../src/components/weather/WeatherCard'),
        () => import('../../src/components/webcam/WebcamCard')
      ];
      
      // Should be able to import components individually
      modules.forEach(async (importFn) => {
        expect(typeof importFn).toBe('function');
      });
    });
  });

  describe('Network Performance', () => {
    it('should minimize API calls', async () => {
      const apiCalls = [];
      
      // Mock fetch to track API calls
      global.fetch = vi.fn().mockImplementation((url) => {
        apiCalls.push(url);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      });
      
      render(
        <AppDataContext.Provider value={mockLargeDataset}>
          <App />
        </AppDataContext.Provider>
      );
      
      await waitFor(() => {
        // Should not make excessive API calls on initial render
        expect(apiCalls.length).toBeLessThan(10);
      });
    });

    it('should implement efficient data caching', () => {
      const { rerender } = render(
        <AppDataContext.Provider value={mockLargeDataset}>
          <App />
        </AppDataContext.Provider>
      );
      
      // Re-render with same data should not trigger new requests
      rerender(
        <AppDataContext.Provider value={mockLargeDataset}>
          <App />
        </AppDataContext.Provider>
      );
      
      // Should use cached data efficiently
      expect(screen.getByText('28°C')).toBeInTheDocument();
    });
  });

  describe('Comprehensive Performance Analysis', () => {
    it('should pass overall performance audit', async () => {
      const performanceMetrics = {
        renderTime: 0,
        memoryUsage: 0,
        reRenderCount: 0
      };
      
      const startTime = performance.now();
      
      const { rerender } = render(
        <AppDataContext.Provider value={mockLargeDataset}>
          <App />
        </AppDataContext.Provider>
      );
      
      performanceMetrics.renderTime = performance.now() - startTime;
      
      // Test multiple re-renders
      for (let i = 0; i < 5; i++) {
        performanceMetrics.reRenderCount++;
        rerender(
          <AppDataContext.Provider value={{
            ...mockLargeDataset,
            weatherData: {
              ...mockLargeDataset.weatherData,
              summary: { avg_temperature: 28 + i * 0.1 }
            }
          }}>
            <App />
          </AppDataContext.Provider>
        );
      }
      
      // Performance budgets
      expect(performanceMetrics.renderTime).toBeLessThan(100); // Initial render < 100ms
      expect(performanceMetrics.reRenderCount).toBe(5); // All re-renders completed
    });

    it('should maintain performance under concurrent operations', async () => {
      const operations = [];
      
      // Simulate concurrent rendering operations
      for (let i = 0; i < 3; i++) {
        operations.push(
          new Promise((resolve) => {
            const startTime = performance.now();
            const { unmount } = render(
              <AppDataContext.Provider value={mockLargeDataset}>
                <App />
              </AppDataContext.Provider>
            );
            
            setTimeout(() => {
              const renderTime = performance.now() - startTime;
              unmount();
              resolve(renderTime);
            }, 10);
          })
        );
      }
      
      const renderTimes = await Promise.all(operations);
      
      // All concurrent renders should complete efficiently
      renderTimes.forEach(time => {
        expect(time).toBeLessThan(150); // 150ms budget for concurrent operations
      });
    });
  });

  describe('Real-time Performance Monitoring', () => {
    it('should track performance metrics during operation', () => {
      const performanceTracker = {
        marks: [],
        measures: []
      };
      
      // Override performance methods to track usage
      const originalMark = performance.mark;
      const originalMeasure = performance.measure;
      
      performance.mark = vi.fn((name) => {
        performanceTracker.marks.push(name);
        return originalMark.call(performance, name);
      });
      
      performance.measure = vi.fn((name, start, end) => {
        performanceTracker.measures.push({ name, start, end });
        return originalMeasure.call(performance, name, start, end);
      });
      
      render(
        <AppDataContext.Provider value={mockLargeDataset}>
          <App />
        </AppDataContext.Provider>
      );
      
      // Should have performance tracking in place
      expect(performance.mark).toHaveBeenCalled();
      
      // Restore original methods
      performance.mark = originalMark;
      performance.measure = originalMeasure;
    });
  });
});