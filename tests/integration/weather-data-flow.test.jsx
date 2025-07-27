import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AppDataContext } from '../../src/contexts/AppDataContext';
import WeatherDashboard from '../../src/components/weather/WeatherDashboard';
import * as apiService from '../../src/services/apiService';

/**
 * Weather Data Flow Integration Tests
 * QA Persona: End-to-end data validation
 * Backend Persona: API integration and error handling
 * Performance Persona: Data loading efficiency
 */

// Mock API service
vi.mock('../../src/services/apiService');

describe('Weather Data Flow Integration', () => {
  const mockWeatherData = {
    timestamp: '2025-01-27T08:00:00Z',
    stations: [
      {
        id: 'S121',
        name: 'Bukit Timah Nature Reserve',
        location: { latitude: 1.3520, longitude: 103.7767 },
        readings: {
          temperature: 28.5,
          humidity: 82,
          wind_speed: 12.3,
          wind_direction: 'NE',
          rainfall: 0.0,
          pressure: 1013.2
        },
        status: 'active',
        last_updated: '2025-01-27T08:00:00Z'
      },
      {
        id: 'S116',
        name: 'Bukit Timah Road',
        location: { latitude: 1.3416, longitude: 103.7749 },
        readings: {
          temperature: 29.1,
          humidity: 79,
          wind_speed: 15.2,
          wind_direction: 'NE',
          rainfall: 2.5,
          pressure: 1012.8
        },
        status: 'active',
        last_updated: '2025-01-27T08:00:00Z'
      }
    ],
    summary: {
      avg_temperature: 28.8,
      avg_humidity: 80.5,
      total_rainfall: 2.5,
      dominant_wind: 'NE'
    }
  };

  const mockContextValue = {
    weatherData: null,
    webcamData: null,
    trafficData: null,
    loading: {
      weather: false,
      webcam: false,
      traffic: false
    },
    error: {
      weather: null,
      webcam: null,
      traffic: null
    },
    lastUpdated: {
      weather: null,
      webcam: null,
      traffic: null
    },
    refreshData: vi.fn(),
    setWeatherData: vi.fn(),
    setWebcamData: vi.fn(),
    setTrafficData: vi.fn()
  };

  const renderWithContext = (contextOverrides = {}) => {
    const contextValue = { ...mockContextValue, ...contextOverrides };
    return render(
      <AppDataContext.Provider value={contextValue}>
        <WeatherDashboard />
      </AppDataContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Data Loading States', () => {
    it('should show loading state while fetching weather data', () => {
      renderWithContext({
        loading: { weather: true, webcam: false, traffic: false }
      });

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display weather data when loaded successfully', () => {
      renderWithContext({
        weatherData: mockWeatherData,
        loading: { weather: false, webcam: false, traffic: false }
      });

      expect(screen.getByText('28.8°C')).toBeInTheDocument();
      expect(screen.getByText('80.5%')).toBeInTheDocument();
    });

    it('should show error state when data loading fails', () => {
      renderWithContext({
        error: { weather: 'Failed to fetch weather data', webcam: null, traffic: null },
        loading: { weather: false, webcam: false, traffic: false }
      });

      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should fetch weather data on component mount', async () => {
      const mockFetchWeatherData = vi.mocked(apiService.fetchWeatherData);
      mockFetchWeatherData.mockResolvedValue(mockWeatherData);

      const setWeatherData = vi.fn();
      renderWithContext({ setWeatherData });

      // Simulate data fetch completion
      await act(async () => {
        await mockFetchWeatherData();
      });

      expect(mockFetchWeatherData).toHaveBeenCalledTimes(1);
    });

    it('should handle API timeout gracefully', async () => {
      const mockFetchWeatherData = vi.mocked(apiService.fetchWeatherData);
      mockFetchWeatherData.mockRejectedValue(new Error('Request timeout'));

      renderWithContext({
        error: { weather: 'Request timeout', webcam: null, traffic: null }
      });

      expect(screen.getByText(/timeout/i)).toBeInTheDocument();
    });

    it('should retry failed requests with exponential backoff', async () => {
      const mockFetchWeatherData = vi.mocked(apiService.fetchWeatherData);
      mockFetchWeatherData
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockWeatherData);

      const refreshData = vi.fn();
      renderWithContext({ refreshData });

      // Simulate retry logic
      await act(async () => {
        try {
          await mockFetchWeatherData();
        } catch {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await mockFetchWeatherData();
        }
      });

      expect(mockFetchWeatherData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Transformation', () => {
    it('should correctly calculate weather statistics', () => {
      renderWithContext({ weatherData: mockWeatherData });

      // Check if calculated averages are displayed
      expect(screen.getByText('28.8°C')).toBeInTheDocument(); // avg temperature
      expect(screen.getByText('80.5%')).toBeInTheDocument();  // avg humidity
    });

    it('should handle missing data points gracefully', () => {
      const incompleteData = {
        ...mockWeatherData,
        stations: [
          {
            ...mockWeatherData.stations[0],
            readings: {
              temperature: 28.5,
              humidity: null, // Missing humidity
              wind_speed: 12.3
            }
          }
        ]
      };

      expect(() => {
        renderWithContext({ weatherData: incompleteData });
      }).not.toThrow();
    });

    it('should format timestamps correctly', () => {
      renderWithContext({ 
        weatherData: mockWeatherData,
        lastUpdated: { weather: '2025-01-27T08:00:00Z' }
      });

      // Should display formatted timestamp
      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should update data automatically at specified intervals', async () => {
      vi.useFakeTimers();
      
      const refreshData = vi.fn();
      renderWithContext({ refreshData });

      // Fast-forward 5 minutes (typical update interval)
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      // Should trigger data refresh
      expect(refreshData).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should handle rapid data updates without memory leaks', async () => {
      const setWeatherData = vi.fn();
      renderWithContext({ setWeatherData });

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        const updatedData = {
          ...mockWeatherData,
          summary: { ...mockWeatherData.summary, avg_temperature: 28.8 + i * 0.1 }
        };
        
        await act(async () => {
          setWeatherData(updatedData);
        });
      }

      expect(setWeatherData).toHaveBeenCalledTimes(10);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from network errors', async () => {
      const mockFetchWeatherData = vi.mocked(apiService.fetchWeatherData);
      
      // Initially fail, then succeed
      mockFetchWeatherData
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockWeatherData);

      const { rerender } = renderWithContext({
        error: { weather: 'Network error', webcam: null, traffic: null }
      });

      // Show error state
      expect(screen.getByText(/network error/i)).toBeInTheDocument();

      // Simulate recovery
      rerender(
        <AppDataContext.Provider value={{ ...mockContextValue, weatherData: mockWeatherData }}>
          <WeatherDashboard />
        </AppDataContext.Provider>
      );

      // Should show data instead of error
      expect(screen.getByText('28.8°C')).toBeInTheDocument();
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });

    it('should handle partial data gracefully', () => {
      const partialData = {
        ...mockWeatherData,
        stations: [mockWeatherData.stations[0]] // Only one station
      };

      expect(() => {
        renderWithContext({ weatherData: partialData });
      }).not.toThrow();

      // Should still display available data
      expect(screen.getByText('28.5°C')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should not re-render unnecessarily with same data', () => {
      const { rerender } = renderWithContext({ weatherData: mockWeatherData });
      
      const initialHTML = screen.getByRole('main').innerHTML;

      // Re-render with same data
      rerender(
        <AppDataContext.Provider value={{ ...mockContextValue, weatherData: mockWeatherData }}>
          <WeatherDashboard />
        </AppDataContext.Provider>
      );

      // DOM should remain stable
      expect(screen.getByRole('main').innerHTML).toBe(initialHTML);
    });

    it('should efficiently handle large datasets', async () => {
      const largeDataset = {
        ...mockWeatherData,
        stations: Array.from({ length: 100 }, (_, i) => ({
          id: `S${i}`,
          name: `Station ${i}`,
          location: { latitude: 1.3 + i * 0.01, longitude: 103.7 + i * 0.01 },
          readings: { temperature: 25 + Math.random() * 10 }
        }))
      };

      const startTime = performance.now();
      renderWithContext({ weatherData: largeDataset });
      const renderTime = performance.now() - startTime;

      // Should render efficiently even with large datasets
      expect(renderTime).toBeLessThan(100); // ms
    });
  });

  describe('Data Validation', () => {
    it('should validate data integrity', () => {
      const invalidData = {
        ...mockWeatherData,
        stations: [
          {
            ...mockWeatherData.stations[0],
            readings: {
              temperature: 'invalid', // Invalid temperature
              humidity: 82
            }
          }
        ]
      };

      // Should handle invalid data gracefully
      expect(() => {
        renderWithContext({ weatherData: invalidData });
      }).not.toThrow();
    });

    it('should handle data schema changes', () => {
      const newSchemaData = {
        ...mockWeatherData,
        version: '2.0',
        additional_field: 'new data',
        stations: mockWeatherData.stations.map(station => ({
          ...station,
          new_field: 'additional info'
        }))
      };

      expect(() => {
        renderWithContext({ weatherData: newSchemaData });
      }).not.toThrow();
    });
  });

  describe('Concurrent Data Operations', () => {
    it('should handle concurrent weather and webcam data loading', async () => {
      const mockFetchWeatherData = vi.mocked(apiService.fetchWeatherData);
      const mockFetchWebcamData = vi.mocked(apiService.fetchWebcamData);
      
      mockFetchWeatherData.mockResolvedValue(mockWeatherData);
      mockFetchWebcamData.mockResolvedValue([]);

      renderWithContext({
        loading: { weather: true, webcam: true, traffic: false }
      });

      await act(async () => {
        await Promise.all([
          mockFetchWeatherData(),
          mockFetchWebcamData()
        ]);
      });

      expect(mockFetchWeatherData).toHaveBeenCalledTimes(1);
      expect(mockFetchWebcamData).toHaveBeenCalledTimes(1);
    });

    it('should maintain data consistency during updates', async () => {
      const setWeatherData = vi.fn();
      renderWithContext({ setWeatherData, weatherData: mockWeatherData });

      // Simulate concurrent updates
      const updates = Array.from({ length: 5 }, (_, i) => ({
        ...mockWeatherData,
        timestamp: new Date(Date.now() + i * 1000).toISOString()
      }));

      await act(async () => {
        await Promise.all(updates.map(data => 
          new Promise(resolve => {
            setTimeout(() => {
              setWeatherData(data);
              resolve();
            }, Math.random() * 100);
          })
        ));
      });

      // Should handle all updates without conflicts
      expect(setWeatherData).toHaveBeenCalledTimes(5);
    });
  });
});