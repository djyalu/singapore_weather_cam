import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useWeatherData } from '../../hooks/useWeatherData';
import StationSelector from './StationSelector';
import StationComparison from './StationComparison';
import RegionalWeatherDisplay from './RegionalWeatherDisplay';
import { 
  BarChart3, 
  Map, 
  Grid3X3, 
  Settings, 
  RefreshCw, 
  Database, 
  Activity,
  MapPin,
  Thermometer,
  Droplets,
  Cloud,
  Wind,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Star,
  Globe
} from 'lucide-react';

/**
 * 🎨 FRONTEND + 🏗️ ARCHITECT: Enhanced 59-Station Weather Dashboard
 * 
 * Complete weather monitoring system featuring:
 * - Full 59-station NEA data integration
 * - Interactive station selection and comparison
 * - Real-time data visualization
 * - Regional analysis and filtering
 * - Performance-optimized rendering
 * - Comprehensive accessibility support
 */
const Enhanced59StationDashboard = React.memo(({ className = '' }) => {
  const {
    // Core data
    weatherData,
    isLoading,
    error,
    lastUpdate,
    refetch,
    
    // Enhanced 59-station utilities
    stations: stationUtils,
    
    // Legacy compatibility
    current
  } = useWeatherData();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStations, setSelectedStations] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    region: 'all',
    dataType: 'all',
    priority: 'all'
  });

  // Calculate system status and filtered stations
  const systemStatus = useMemo(() => {
    if (!weatherData || !stationUtils) {
      return {
        totalStations: 0,
        activeStations: 0,
        dataQualityScore: 0,
        geographicCoverage: 0,
        filteredStations: []
      };
    }

    const allStations = stationUtils.getAllStations();
    const stats = stationUtils.getStationStats();
    
    // Apply filters
    let filtered = allStations;
    if (filterOptions.region !== 'all') {
      filtered = stationUtils.getStationsByRegion(filterOptions.region);
    }
    if (filterOptions.dataType !== 'all') {
      filtered = stationUtils.getStationsByDataType(filterOptions.dataType);
    }
    if (filterOptions.priority !== 'all') {
      filtered = stationUtils.getStationsByPriority(filterOptions.priority);
    }
    
    return {
      totalStations: allStations.length,
      activeStations: allStations.filter(s => s.currentData?.temperature || s.currentData?.humidity).length,
      dataQualityScore: weatherData.data_quality_score || 0,
      geographicCoverage: weatherData.geographic_coverage?.coverage_percentage || 0,
      regionBreakdown: stats.byRegion,
      dataTypeBreakdown: stats.byDataType,
      filteredStations: filtered
    };
  }, [weatherData, stationUtils, filterOptions]);

  // Handle station selection
  const handleStationSelect = useCallback((station) => {
    setSelectedStations(prev => {
      if (prev.some(s => s.station_id === station.station_id)) {
        return prev; // Already selected
      }
      return [...prev, station].slice(-5); // Limit to 5 selections
    });
  }, []);

  // Handle station deselection  
  const handleStationDeselect = useCallback((station) => {
    setSelectedStations(prev => 
      prev.filter(s => s.station_id !== station.station_id)
    );
  }, []);

  // Get current weather summary
  const weatherSummary = useMemo(() => {
    if (!weatherData?.data) return null;
    
    return {
      temperature: {
        current: weatherData.data.temperature?.average?.toFixed(1) || 'N/A',
        range: weatherData.data.temperature ? 
          `${weatherData.data.temperature.min?.toFixed(1)}° - ${weatherData.data.temperature.max?.toFixed(1)}°` : 'N/A',
        stations: weatherData.data.temperature?.total_stations || 0
      },
      humidity: {
        current: weatherData.data.humidity?.average?.toFixed(0) || 'N/A',
        range: weatherData.data.humidity ? 
          `${weatherData.data.humidity.min?.toFixed(0)}% - ${weatherData.data.humidity.max?.toFixed(0)}%` : 'N/A',
        stations: weatherData.data.humidity?.total_stations || 0
      },
      rainfall: {
        total: weatherData.data.rainfall?.total?.toFixed(1) || '0.0',
        activeStations: weatherData.data.rainfall?.readings?.filter(r => r.value > 0).length || 0,
        totalStations: weatherData.data.rainfall?.total_stations || 0
      }
    };
  }, [weatherData]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !weatherData) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
        <div className="text-red-600 mb-2">
          <Database className="w-8 h-8 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Data Loading Error</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Loading
        </button>
      </div>
    );
  }

  // Status indicator component
  const StatusIndicator = ({ status, label }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'operational': return 'text-green-600 bg-green-50 border-green-200';
        case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'error': return 'text-red-600 bg-red-50 border-red-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case 'operational': return <CheckCircle className="w-4 h-4" />;
        case 'warning': return <AlertCircle className="w-4 h-4" />;
        case 'error': return <AlertCircle className="w-4 h-4" />;
        default: return <Activity className="w-4 h-4" />;
      }
    };

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
        {getStatusIcon()}
        {label}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header with System Status */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Singapore Weather Monitoring System
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Enhanced 59-Station NEA Integration • Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            aria-label="Refresh weather data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* System Status Bar */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Total Stations</div>
              <MapPin className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{systemStatus.totalStations}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Active Stations</div>
              <Activity className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{systemStatus.activeStations}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Data Quality</div>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{systemStatus.dataQualityScore}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Coverage</div>
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{systemStatus.geographicCoverage}%</div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 flex items-center justify-between">
          <StatusIndicator 
            status={error ? 'error' : 'operational'} 
            label={`System ${error ? 'Error' : 'Operational'}`} 
          />
          <div className="text-sm text-gray-500">
            {selectedStations.length > 0 && `${selectedStations.length} station${selectedStations.length !== 1 ? 's' : ''} selected`}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Dashboard tabs">
          {[
            { id: 'overview', label: 'Overview', icon: Grid3X3 },
            { id: 'stations', label: 'Stations', icon: Database, count: systemStatus.filteredStations.length },
            { id: 'compare', label: 'Compare', icon: BarChart3, count: selectedStations.length },
            { id: 'map', label: 'Map', icon: Map }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-600 text-xs rounded-full px-2 py-0.5">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div id="tabpanel-overview" role="tabpanel" aria-labelledby="tab-overview">
            <div className="space-y-6">
              {/* Weather Summary Cards */}
              {weatherSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Temperature Card */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Temperature</h3>
                      <Thermometer className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-gray-900">
                        {weatherSummary.temperature.current}°C
                      </div>
                      <div className="text-sm text-gray-600">
                        Range: {weatherSummary.temperature.range}
                      </div>
                      <div className="text-xs text-gray-500">
                        {weatherSummary.temperature.stations} stations reporting
                      </div>
                    </div>
                  </div>

                  {/* Humidity Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Humidity</h3>
                      <Droplets className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-gray-900">
                        {weatherSummary.humidity.current}%
                      </div>
                      <div className="text-sm text-gray-600">
                        Range: {weatherSummary.humidity.range}
                      </div>
                      <div className="text-xs text-gray-500">
                        {weatherSummary.humidity.stations} stations reporting
                      </div>
                    </div>
                  </div>

                  {/* Rainfall Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Rainfall</h3>
                      <Cloud className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-gray-900">
                        {weatherSummary.rainfall.total}mm
                      </div>
                      <div className="text-sm text-gray-600">
                        {weatherSummary.rainfall.activeStations} stations with rain
                      </div>
                      <div className="text-xs text-gray-500">
                        {weatherSummary.rainfall.totalStations} stations total
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Regional Breakdown */}
              {systemStatus.regionBreakdown && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Coverage</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(systemStatus.regionBreakdown).map(([region, count]) => (
                      <div key={region} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <div className="text-sm text-gray-600 capitalize">{region}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regional Weather Display - 정확한 지역별 데이터 */}
              <RegionalWeatherDisplay 
                weatherData={weatherData}
                className="mb-6"
              />

              {/* Key Station Highlights */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 관측소 현황</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemStatus.filteredStations.slice(0, 6).map(station => (
                    <div 
                      key={station.station_id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleStationSelect(station)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{station.name}</h4>
                          <p className="text-xs text-gray-500">{station.station_id}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          station.priority_level === 'critical' ? 'bg-red-100 text-red-700' :
                          station.priority_level === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {station.priority_level}
                        </span>
                      </div>
                      
                      {station.currentData && (
                        <div className="space-y-1">
                          {station.currentData.temperature && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">온도:</span>
                              <span className="font-medium">
                                {station.currentData.temperature.toFixed(1)}°C
                              </span>
                            </div>
                          )}
                          {station.currentData.humidity && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">습도:</span>
                              <span className="font-medium">
                                {Math.round(station.currentData.humidity)}%
                              </span>
                            </div>
                          )}
                          {station.currentData.rainfall !== undefined && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">강수량:</span>
                              <span className="font-medium">
                                {station.currentData.rainfall.toFixed(1)}mm
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stations Tab */}
        {activeTab === 'stations' && (
          <div id="tabpanel-stations" role="tabpanel" aria-labelledby="tab-stations">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Station Selection</h3>
                <div className="text-sm text-gray-500">
                  {systemStatus.filteredStations.length} stations available
                </div>
              </div>
              
              <StationSelector
                stations={systemStatus.filteredStations}
                selectedStations={selectedStations}
                onStationSelect={handleStationSelect}
                onStationDeselect={handleStationDeselect}
                maxSelections={5}
                allowMultiple={true}
              />
            </div>
          </div>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <div id="tabpanel-compare" role="tabpanel" aria-labelledby="tab-compare">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Station Comparison</h3>
                {selectedStations.length > 0 && (
                  <button
                    onClick={() => setSelectedStations([])}
                    className="text-sm text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                  >
                    Clear all selections
                  </button>
                )}
              </div>
              
              <StationComparison
                stations={selectedStations}
                onRemoveStation={handleStationDeselect}
                showDetailedMetrics={true}
              />
            </div>
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div id="tabpanel-map" role="tabpanel" aria-labelledby="tab-map">
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Globe className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Map View</h3>
              <p className="text-gray-600 mb-4">
                Geographic visualization of all {systemStatus.totalStations} weather stations across Singapore.
              </p>
              <div className="text-sm text-gray-500">
                Map integration with existing MapView component will be implemented here.
                This will show all {systemStatus.totalStations} stations with real-time data overlays.
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
});

Enhanced59StationDashboard.propTypes = {
  className: PropTypes.string
};

Enhanced59StationDashboard.displayName = 'Enhanced59StationDashboard';

export default Enhanced59StationDashboard;