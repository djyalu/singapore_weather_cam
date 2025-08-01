import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useWeatherData } from '../../hooks/useWeatherData';
import StationSelector from './StationSelector';
import StationComparison from './StationComparison';
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Singapore Weather Monitoring System
            </CardTitle>
            <button
              onClick={refetch}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              title="Refresh all station data"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalStations}</div>
              <div className="text-sm text-gray-600">Total Stations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{activeStations}</div>
              <div className="text-sm text-gray-600">Active Stations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{dataQualityScore}</div>
              <div className="text-sm text-gray-600">Quality Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {geographicCoverage?.coverage_percentage || 0}%
              </div>
              <div className="text-sm text-gray-600">Coverage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="stations" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Stations ({filteredStations.length})
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Compare ({selectedStations.size})
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Map View
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Shows overall Singapore weather + key stations */}
        <TabsContent value="overview" className="space-y-6">
          {/* Overall Singapore Weather */}
          <SingaporeOverallWeather 
            weatherData={weatherData}
            className="mb-6"
          />

          {/* Key Station Highlights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Weather Stations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStations.slice(0, 6).map(station => {
                  const stationData = getStationData(station.station_id);
                  return (
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
                      
                      {stationData?.readings && (
                        <div className="space-y-1">
                          {stationData.readings.temperature && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Temperature:</span>
                              <span className="font-medium">
                                {stationData.readings.temperature.value.toFixed(1)}°C
                              </span>
                            </div>
                          )}
                          {stationData.readings.humidity && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Humidity:</span>
                              <span className="font-medium">
                                {Math.round(stationData.readings.humidity.value)}%
                              </span>
                            </div>
                          )}
                          {stationData.readings.rainfall && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Rainfall:</span>
                              <span className="font-medium">
                                {stationData.readings.rainfall.value.toFixed(1)}mm
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stations Tab - Station selection and management */}
        <TabsContent value="stations" className="space-y-6">
          <StationSelector
            stations={filteredStations}
            selectedStations={selectedStations}
            onStationSelect={handleStationSelect}
            onStationDeselect={handleStationDeselect}
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>

        {/* Comparison Tab - Station comparison */}
        <TabsContent value="comparison" className="space-y-6">
          <StationComparison
            stations={Array.from(selectedStations).map(id => 
              filteredStations.find(s => s.station_id === id) || { station_id: id, name: `Station ${id}` }
            )}
            stationData={selectedStationData}
            onRemoveStation={handleRemoveFromComparison}
          />
          
          {selectedStations.size === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Stations Selected for Comparison
                </h3>
                <p className="text-gray-600 mb-4">
                  Select stations from the Stations tab to compare their weather data.
                </p>
                <button
                  onClick={() => setActiveTab('stations')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Select Stations
                </button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Map Tab - Geographic visualization */}
        <TabsContent value="map" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5" />
                Weather Stations Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Map className="w-12 h-12 mx-auto mb-2" />
                  <p>Interactive map with all {totalStations} weather stations</p>
                  <p className="text-sm">Click stations to view detailed data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && rawWeatherData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              <Settings className="w-4 h-4 inline mr-2" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
              <div>
                <strong>Data Source:</strong> {rawWeatherData.source}
              </div>
              <div>
                <strong>Last Updated:</strong> {new Date(rawWeatherData.timestamp).toLocaleString()}
              </div>
              <div>
                <strong>API Calls:</strong> {rawWeatherData.api_calls}/{rawWeatherData.successful_calls} successful
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

Enhanced59StationDashboard.propTypes = {
  className: PropTypes.string
};

Enhanced59StationDashboard.displayName = 'Enhanced59StationDashboard';

export default Enhanced59StationDashboard;