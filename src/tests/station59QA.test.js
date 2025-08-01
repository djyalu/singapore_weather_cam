/**
 * ✅ QA: Comprehensive 59-Station System Test Suite
 * 
 * Test scenarios covering:
 * - Data loading and transformation
 * - Station selection and filtering
 * - Comparison functionality
 * - Security validation
 * - Performance optimization
 * - User interface accessibility
 * - Error handling and recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useWeatherData } from '../hooks/useWeatherData';
import { validateStationData } from '../utils/station59SecurityValidation';
import { transformWeatherData } from '../utils/weatherDataTransformer';
import StationSelector from '../components/weather/StationSelector';
import StationComparison from '../components/weather/StationComparison';
import Enhanced59StationDashboard from '../components/weather/Enhanced59StationDashboard';

// Mock data for testing
const mockStationData = {
  timestamp: '2025-08-01T23:04:29.724Z',
  source: 'NEA Singapore (Test)',
  stations_used: ['S109', 'S107', 'S24', 'S104', 'S50'],
  data_quality_score: 95,
  data: {
    temperature: {
      readings: [
        { station: 'S109', value: 27.3, station_name: 'Ang Mo Kio Avenue 5', coordinates: { lat: 1.3337, lng: 103.7768 } },
        { station: 'S107', value: 28.1, station_name: 'East Coast Parkway', coordinates: { lat: 1.3048, lng: 103.9318 } },
        { station: 'S24', value: 26.9, station_name: 'Choa Chu Kang', coordinates: { lat: 1.3677, lng: 103.7069 } }
      ],
      total_stations: 3,
      average: 27.4,
      min: 26.9,
      max: 28.1
    },
    humidity: {
      readings: [
        { station: 'S109', value: 84.7, station_name: 'Ang Mo Kio Avenue 5', coordinates: { lat: 1.3337, lng: 103.7768 } },
        { station: 'S107', value: 78.2, station_name: 'East Coast Parkway', coordinates: { lat: 1.3048, lng: 103.9318 } }
      ],
      total_stations: 2,
      average: 81.5,
      min: 78.2,
      max: 84.7
    },
    rainfall: {
      readings: [
        { station: 'S109', value: 0, station_name: 'Ang Mo Kio Avenue 5', coordinates: { lat: 1.3337, lng: 103.7768 } },
        { station: 'S50', value: 0.2, station_name: 'Clementi Road', coordinates: { lat: 1.3162, lng: 103.7649 } }
      ],
      total_stations: 2,
      average: 0.1,
      min: 0,
      max: 0.2
    }
  },
  station_details: {
    'S109': {
      station_id: 'S109',
      name: 'Ang Mo Kio Avenue 5',
      coordinates: { lat: 1.3337, lng: 103.7768 },
      data_types: ['temperature', 'humidity', 'rainfall'],
      priority_level: 'critical',
      priority_score: 131.9,
      reliability_score: 1.0
    },
    'S107': {
      station_id: 'S107',
      name: 'East Coast Parkway',
      coordinates: { lat: 1.3048, lng: 103.9318 },
      data_types: ['temperature', 'humidity'],
      priority_level: 'high',
      priority_score: 95.5,
      reliability_score: 0.95
    },
    'S24': {
      station_id: 'S24',
      name: 'Choa Chu Kang',
      coordinates: { lat: 1.3677, lng: 103.7069 },
      data_types: ['temperature'],
      priority_level: 'high',
      priority_score: 88.2,
      reliability_score: 0.90
    },
    'S50': {
      station_id: 'S50',
      name: 'Clementi Road',
      coordinates: { lat: 1.3162, lng: 103.7649 },
      data_types: ['rainfall'],
      priority_level: 'medium',
      priority_score: 75.0,
      reliability_score: 0.85
    }
  },
  geographic_coverage: {
    regions_covered: 4,
    total_regions: 5,
    coverage_percentage: 80,
    stations_by_region: {
      north: ['S24'],
      south: [],
      east: ['S107'],
      west: ['S50'],
      central: ['S109']
    }
  }
};\n\nconst mockInvalidStationData = {\n  timestamp: 'invalid-timestamp',\n  source: '',\n  stations_used: ['INVALID_ID', 'S999999'],\n  data: {\n    temperature: {\n      readings: [\n        { station: 'INVALID', value: 999, coordinates: { lat: 999, lng: 999 } }\n      ]\n    }\n  },\n  station_details: {\n    'INVALID': {\n      station_id: 'INVALID',\n      coordinates: { lat: 999, lng: 999 }\n    }\n  }\n};\n\ndescribe('🧪 59-Station System - Data Layer Tests', () => {\n  describe('Security Validation', () => {\n    it('should validate correct station data', () => {\n      const result = validateStationData(mockStationData);\n      \n      expect(result.isValid).toBe(true);\n      expect(result.securityScore).toBeGreaterThan(80);\n      expect(result.errors).toHaveLength(0);\n      expect(result.sanitizedData).toBeDefined();\n    });\n\n    it('should reject invalid station data', () => {\n      const result = validateStationData(mockInvalidStationData);\n      \n      expect(result.isValid).toBe(false);\n      expect(result.securityScore).toBeLessThan(50);\n      expect(result.errors.length).toBeGreaterThan(0);\n    });\n\n    it('should validate coordinates within Singapore bounds', () => {\n      const validCoords = { lat: 1.3521, lng: 103.8198 };\n      const invalidCoords = { lat: 999, lng: 999 };\n      \n      const validResult = validateStationData({\n        ...mockStationData,\n        station_details: {\n          'S001': {\n            station_id: 'S001',\n            name: 'Test Station',\n            coordinates: validCoords\n          }\n        }\n      });\n      \n      const invalidResult = validateStationData({\n        ...mockStationData,\n        station_details: {\n          'S001': {\n            station_id: 'S001',\n            name: 'Test Station',\n            coordinates: invalidCoords\n          }\n        }\n      });\n      \n      expect(validResult.isValid).toBe(true);\n      expect(invalidResult.isValid).toBe(false);\n    });\n\n    it('should validate weather data value ranges', () => {\n      const invalidData = {\n        ...mockStationData,\n        data: {\n          temperature: {\n            readings: [\n              { station: 'S109', value: 999, station_name: 'Test', coordinates: { lat: 1.3337, lng: 103.7768 } }\n            ]\n          }\n        }\n      };\n      \n      const result = validateStationData(invalidData);\n      expect(result.warnings.length).toBeGreaterThan(0);\n    });\n  });\n\n  describe('Data Transformation', () => {\n    it('should transform raw data correctly', () => {\n      const transformed = transformWeatherData(mockStationData);\n      \n      expect(transformed.current).toBeDefined();\n      expect(transformed.locations).toBeDefined();\n      expect(transformed.meta.stations).toBe(5);\n      expect(transformed.stationDetails).toBeDefined();\n    });\n\n    it('should handle missing data gracefully', () => {\n      const incompleteData = {\n        timestamp: '2025-08-01T23:04:29.724Z',\n        source: 'Test',\n        stations_used: [],\n        data: {},\n        station_details: {}\n      };\n      \n      const transformed = transformWeatherData(incompleteData);\n      expect(transformed).toBeDefined();\n      expect(transformed.current).toBeDefined();\n    });\n\n    it('should calculate performance metrics', () => {\n      const transformed = transformWeatherData(mockStationData);\n      \n      expect(transformed.performance).toBeDefined();\n      expect(transformed.performance.transformation_time_ms).toBeGreaterThan(0);\n      expect(transformed.performance.data_efficiency_score).toBeGreaterThan(0);\n    });\n\n    it('should preserve original data structure', () => {\n      const transformed = transformWeatherData(mockStationData);\n      \n      expect(transformed.data).toEqual(mockStationData.data);\n      expect(transformed.stationDetails).toEqual(mockStationData.station_details);\n    });\n  });\n});\n\ndescribe('🧪 59-Station System - Hook Tests', () => {\n  beforeEach(() => {\n    // Mock fetch\n    global.fetch = vi.fn();\n  });\n\n  afterEach(() => {\n    vi.restoreAllMocks();\n  });\n\n  describe('useWeatherData Hook', () => {\n    it('should load and validate 59-station data', async () => {\n      fetch.mockResolvedValueOnce({\n        ok: true,\n        json: async () => mockStationData\n      });\n\n      const { result } = renderHook(() => useWeatherData());\n      \n      await waitFor(() => {\n        expect(result.current.isLoading).toBe(false);\n      });\n      \n      expect(result.current.totalStations).toBe(5);\n      expect(result.current.rawWeatherData).toBeDefined();\n      expect(result.current.filteredStations).toBeDefined();\n    });\n\n    it('should handle API errors gracefully', async () => {\n      fetch.mockRejectedValueOnce(new Error('Network error'));\n\n      const { result } = renderHook(() => useWeatherData());\n      \n      await waitFor(() => {\n        expect(result.current.isLoading).toBe(false);\n      });\n      \n      expect(result.current.error).toBeDefined();\n      expect(result.current.weatherData).toBeDefined(); // Should fallback to mock data\n    });\n\n    it('should filter stations correctly', async () => {\n      fetch.mockResolvedValueOnce({\n        ok: true,\n        json: async () => mockStationData\n      });\n\n      const { result } = renderHook(() => useWeatherData());\n      \n      await waitFor(() => {\n        expect(result.current.isLoading).toBe(false);\n      });\n      \n      // Test region filter\n      act(() => {\n        result.current.setFilterOptions({ region: 'central', dataType: 'all', quality: 'all' });\n      });\n      \n      expect(result.current.filteredStations.some(s => s.station_id === 'S109')).toBe(true);\n    });\n\n    it('should provide station data extraction', async () => {\n      fetch.mockResolvedValueOnce({\n        ok: true,\n        json: async () => mockStationData\n      });\n\n      const { result } = renderHook(() => useWeatherData());\n      \n      await waitFor(() => {\n        expect(result.current.isLoading).toBe(false);\n      });\n      \n      const stationData = result.current.getStationData('S109');\n      expect(stationData).toBeDefined();\n      expect(stationData.station_id).toBe('S109');\n      expect(stationData.readings).toBeDefined();\n    });\n\n    it('should support station comparison', async () => {\n      fetch.mockResolvedValueOnce({\n        ok: true,\n        json: async () => mockStationData\n      });\n\n      const { result } = renderHook(() => useWeatherData());\n      \n      await waitFor(() => {\n        expect(result.current.isLoading).toBe(false);\n      });\n      \n      const comparison = result.current.compareStations(['S109', 'S107']);\n      expect(comparison).toHaveLength(2);\n      expect(comparison[0].station_id).toBe('S109');\n    });\n  });\n});\n\ndescribe('🧪 59-Station System - Component Tests', () => {\n  const mockStations = [\n    {\n      station_id: 'S109',\n      name: 'Ang Mo Kio Avenue 5',\n      coordinates: { lat: 1.3337, lng: 103.7768 },\n      data_types: ['temperature', 'humidity'],\n      priority_level: 'critical',\n      priority_score: 131.9,\n      reliability_score: 1.0\n    },\n    {\n      station_id: 'S107',\n      name: 'East Coast Parkway',\n      coordinates: { lat: 1.3048, lng: 103.9318 },\n      data_types: ['temperature'],\n      priority_level: 'high',\n      priority_score: 95.5,\n      reliability_score: 0.95\n    }\n  ];\n\n  describe('StationSelector Component', () => {\n    it('should render station list', () => {\n      render(\n        <StationSelector\n          stations={mockStations}\n          selectedStations={new Set()}\n          onStationSelect={vi.fn()}\n          onStationDeselect={vi.fn()}\n        />\n      );\n      \n      expect(screen.getByText('Ang Mo Kio Avenue 5')).toBeInTheDocument();\n      expect(screen.getByText('East Coast Parkway')).toBeInTheDocument();\n    });\n\n    it('should handle station selection', () => {\n      const onSelect = vi.fn();\n      const onDeselect = vi.fn();\n      \n      render(\n        <StationSelector\n          stations={mockStations}\n          selectedStations={new Set()}\n          onStationSelect={onSelect}\n          onStationDeselect={onDeselect}\n        />\n      );\n      \n      const checkbox = screen.getAllByRole('checkbox')[0];\n      fireEvent.click(checkbox);\n      \n      expect(onSelect).toHaveBeenCalled();\n    });\n\n    it('should filter stations by search', () => {\n      render(\n        <StationSelector\n          stations={mockStations}\n          selectedStations={new Set()}\n          onStationSelect={vi.fn()}\n          onStationDeselect={vi.fn()}\n        />\n      );\n      \n      const searchInput = screen.getByPlaceholderText(/search stations/i);\n      fireEvent.change(searchInput, { target: { value: 'Ang Mo Kio' } });\n      \n      expect(screen.getByText('Ang Mo Kio Avenue 5')).toBeInTheDocument();\n      expect(screen.queryByText('East Coast Parkway')).not.toBeInTheDocument();\n    });\n\n    it('should be accessible with keyboard navigation', () => {\n      render(\n        <StationSelector\n          stations={mockStations}\n          selectedStations={new Set()}\n          onStationSelect={vi.fn()}\n          onStationDeselect={vi.fn()}\n        />\n      );\n      \n      const firstStation = screen.getByRole('button', { name: /select.*ang mo kio/i });\n      expect(firstStation).toBeInTheDocument();\n      expect(firstStation).toHaveAttribute('tabIndex', '0');\n    });\n  });\n\n  describe('StationComparison Component', () => {\n    const mockStationData = [\n      {\n        station_id: 'S109',\n        name: 'Ang Mo Kio Avenue 5',\n        coordinates: { lat: 1.3337, lng: 103.7768 },\n        readings: {\n          temperature: { value: 27.3 },\n          humidity: { value: 84.7 }\n        },\n        reliability_score: 1.0\n      },\n      {\n        station_id: 'S107',\n        name: 'East Coast Parkway',\n        coordinates: { lat: 1.3048, lng: 103.9318 },\n        readings: {\n          temperature: { value: 28.1 },\n          humidity: { value: 78.2 }\n        },\n        reliability_score: 0.95\n      }\n    ];\n\n    it('should render comparison table', () => {\n      render(\n        <StationComparison\n          stations={mockStations}\n          stationData={mockStationData}\n          onRemoveStation={vi.fn()}\n        />\n      );\n      \n      expect(screen.getByText('Station Comparison')).toBeInTheDocument();\n      expect(screen.getByText('S109')).toBeInTheDocument();\n      expect(screen.getByText('S107')).toBeInTheDocument();\n    });\n\n    it('should show data values in comparison', () => {\n      render(\n        <StationComparison\n          stations={mockStations}\n          stationData={mockStationData}\n          onRemoveStation={vi.fn()}\n        />\n      );\n      \n      expect(screen.getByText('27.3')).toBeInTheDocument();\n      expect(screen.getByText('28.1')).toBeInTheDocument();\n      expect(screen.getByText('84.7')).toBeInTheDocument();\n    });\n\n    it('should handle station removal', () => {\n      const onRemove = vi.fn();\n      \n      render(\n        <StationComparison\n          stations={mockStations}\n          stationData={mockStationData}\n          onRemoveStation={onRemove}\n        />\n      );\n      \n      const removeButtons = screen.getAllByLabelText(/remove.*from comparison/i);\n      fireEvent.click(removeButtons[0]);\n      \n      expect(onRemove).toHaveBeenCalledWith('S109');\n    });\n\n    it('should show empty state when no stations selected', () => {\n      render(\n        <StationComparison\n          stations={[]}\n          stationData={[]}\n          onRemoveStation={vi.fn()}\n        />\n      );\n      \n      expect(screen.getByText('No Stations Selected')).toBeInTheDocument();\n    });\n  });\n});\n\ndescribe('🧪 59-Station System - Performance Tests', () => {\n  it('should handle large datasets efficiently', () => {\n    const largeStationSet = Array.from({ length: 59 }, (_, i) => ({\n      station_id: `S${i + 1}`,\n      name: `Station ${i + 1}`,\n      coordinates: { lat: 1.3 + Math.random() * 0.2, lng: 103.7 + Math.random() * 0.3 },\n      data_types: ['temperature', 'humidity'],\n      priority_level: 'medium',\n      priority_score: 50 + Math.random() * 50,\n      reliability_score: 0.8 + Math.random() * 0.2\n    }));\n\n    const startTime = performance.now();\n    \n    render(\n      <StationSelector\n        stations={largeStationSet}\n        selectedStations={new Set()}\n        onStationSelect={vi.fn()}\n        onStationDeselect={vi.fn()}\n      />\n    );\n    \n    const renderTime = performance.now() - startTime;\n    \n    // Should render 59 stations in under 100ms\n    expect(renderTime).toBeLessThan(100);\n    expect(screen.getAllByRole('checkbox')).toHaveLength(59);\n  });\n\n  it('should efficiently filter large station lists', () => {\n    const largeStationSet = Array.from({ length: 100 }, (_, i) => ({\n      station_id: `S${i + 1}`,\n      name: i < 10 ? `Ang Mo Kio ${i}` : `Station ${i + 1}`,\n      coordinates: { lat: 1.3, lng: 103.7 },\n      data_types: ['temperature'],\n      priority_level: 'medium',\n      priority_score: 50,\n      reliability_score: 0.8\n    }));\n\n    render(\n      <StationSelector\n        stations={largeStationSet}\n        selectedStations={new Set()}\n        onStationSelect={vi.fn()}\n        onStationDeselect={vi.fn()}\n      />\n    );\n    \n    const searchInput = screen.getByPlaceholderText(/search stations/i);\n    \n    const startTime = performance.now();\n    fireEvent.change(searchInput, { target: { value: 'Ang Mo Kio' } });\n    const filterTime = performance.now() - startTime;\n    \n    // Filtering should be fast\n    expect(filterTime).toBeLessThan(50);\n    \n    // Should show only filtered results\n    const stationCards = screen.getAllByRole('button', { name: /select.*station/i });\n    expect(stationCards.length).toBeLessThanOrEqual(10);\n  });\n});\n\ndescribe('🧪 59-Station System - Integration Tests', () => {\n  beforeEach(() => {\n    global.fetch = vi.fn();\n  });\n\n  afterEach(() => {\n    vi.restoreAllMocks();\n  });\n\n  it('should integrate all components in dashboard', async () => {\n    fetch.mockResolvedValueOnce({\n      ok: true,\n      json: async () => mockStationData\n    });\n\n    render(<Enhanced59StationDashboard />);\n    \n    await waitFor(() => {\n      expect(screen.getByText(/singapore weather monitoring system/i)).toBeInTheDocument();\n    });\n    \n    // Should show system status\n    expect(screen.getByText('5')).toBeInTheDocument(); // Total stations\n    expect(screen.getByText('95')).toBeInTheDocument(); // Quality score\n    \n    // Should have tabs\n    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();\n    expect(screen.getByRole('tab', { name: /stations/i })).toBeInTheDocument();\n    expect(screen.getByRole('tab', { name: /compare/i })).toBeInTheDocument();\n  });\n\n  it('should switch between dashboard tabs', async () => {\n    fetch.mockResolvedValueOnce({\n      ok: true,\n      json: async () => mockStationData\n    });\n\n    render(<Enhanced59StationDashboard />);\n    \n    await waitFor(() => {\n      expect(screen.getByText(/singapore weather monitoring system/i)).toBeInTheDocument();\n    });\n    \n    // Click stations tab\n    const stationsTab = screen.getByRole('tab', { name: /stations/i });\n    fireEvent.click(stationsTab);\n    \n    await waitFor(() => {\n      expect(screen.getByText('Station Selection')).toBeInTheDocument();\n    });\n  });\n\n  it('should handle end-to-end station selection and comparison', async () => {\n    fetch.mockResolvedValueOnce({\n      ok: true,\n      json: async () => mockStationData\n    });\n\n    render(<Enhanced59StationDashboard />);\n    \n    await waitFor(() => {\n      expect(screen.getByText(/singapore weather monitoring system/i)).toBeInTheDocument();\n    });\n    \n    // Go to stations tab\n    fireEvent.click(screen.getByRole('tab', { name: /stations/i }));\n    \n    await waitFor(() => {\n      expect(screen.getByText('Station Selection')).toBeInTheDocument();\n    });\n    \n    // Select a station\n    const checkbox = screen.getAllByRole('checkbox')[0];\n    fireEvent.click(checkbox);\n    \n    // Go to comparison tab\n    fireEvent.click(screen.getByRole('tab', { name: /compare/i }));\n    \n    await waitFor(() => {\n      expect(screen.getByText('Station Comparison')).toBeInTheDocument();\n    });\n  });\n});"