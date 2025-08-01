# NEA Stations Comprehensive Integration Guide

## Overview

This guide documents the comprehensive NEA weather stations enhancement system that transforms the weather monitoring capabilities from limited station coverage (4 temperature stations) to a complete monitoring system utilizing Singapore's full NEA weather station network (59+ stations).

## System Architecture

### Core Components

1. **NEA Stations Mapper** (`scripts/nea-stations-mapper.js`)
   - Discovers all available NEA weather stations
   - Maps station coordinates and metadata
   - Generates comprehensive stations database

2. **Enhanced Weather Collector** (`scripts/enhanced-weather-collector.js`)
   - Uses intelligent station selection algorithms
   - Optimizes data collection based on proximity and reliability
   - Provides enhanced data quality metrics

3. **Station Configuration Service** (`src/services/stationConfigService.js`)
   - Manages station database and configuration
   - Provides intelligent station selection APIs
   - Handles fallback mechanisms

4. **Station Monitoring Service** (`src/services/stationMonitoringService.js`)
   - Real-time station status monitoring
   - Reliability tracking and alerting
   - Performance analytics

5. **Enhanced UI Components**
   - `StationsMapView.jsx` - Interactive stations map
   - `StationsBrowser.jsx` - Comprehensive stations browser
   - `EnhancedWeatherDashboard.jsx` - Integrated weather dashboard
   - `StationMonitoringDashboard.jsx` - Monitoring and admin interface

## Generated Data Structure

### Stations Database (`/data/stations/`)

```
data/stations/
├── nea-stations-complete.json          # Complete stations database
├── stations-list.json                  # Simplified stations list
├── stations-temperature.json           # Temperature stations only
├── stations-humidity.json              # Humidity stations only
├── stations-rainfall.json              # Rainfall stations only
├── stations-wind.json                  # Wind measurement stations
├── stations-priority-critical.json     # Critical priority stations
├── stations-priority-high.json         # High priority stations
├── stations-priority-medium.json       # Medium priority stations
├── stations-priority-low.json          # Low priority stations
├── stations-statistics.json            # Statistics summary
└── stations-report.md                  # Human-readable report
```

### Enhanced Weather Data Structure

The new system provides richer weather data with station metadata:

```json
{
  "timestamp": "2025-08-01T23:04:29.724Z",
  "source": "NEA Singapore (Enhanced with Intelligent Station Selection)",
  "collection_time_ms": 10665,
  "api_calls": 9,
  "successful_calls": 7,
  "failed_calls": 2,
  "stations_used": ["S109", "S107", "S24", "..."],
  "data_quality_score": 99,
  "data": {
    "temperature": {
      "readings": [
        {
          "station": "S109",
          "value": 27.3,
          "station_name": "Ang Mo Kio Avenue 5",
          "coordinates": { "lat": 1.3337, "lng": 103.7768 }
        }
      ],
      "total_stations": 3,
      "average": 27.1,
      "min": 25.9,
      "max": 28.1,
      "coverage_area": "3 stations across Singapore"
    }
  },
  "station_details": {
    "S109": {
      "station_id": "S109",
      "name": "Ang Mo Kio Avenue 5",
      "coordinates": { "lat": 1.3337, "lng": 103.7768 },
      "data_types": ["temperature", "humidity", "rainfall"],
      "priority_level": "critical",
      "priority_score": 131.94,
      "proximities": {
        "hwa_chong": { "distance_km": 1.81, "priority": "primary" }
      },
      "reliability_score": 1.0
    }
  },
  "geographic_coverage": {
    "regions_covered": 5,
    "total_regions": 5,
    "coverage_percentage": 100,
    "stations_by_region": {
      "north": 4, "south": 7, "east": 25, "west": 3, "central": 20
    }
  }
}
```

## Usage Examples

### 1. Basic Integration in React Components

```jsx
import { stationConfigService } from '../services/stationConfigService.js';
import { EnhancedWeatherDashboard } from '../components/weather/EnhancedWeatherDashboard.jsx';

function MyWeatherApp() {
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    // Load enhanced weather data
    fetch('/data/weather/latest.json')
      .then(res => res.json())
      .then(data => setWeatherData(data));
  }, []);

  return (
    <EnhancedWeatherDashboard 
      data={weatherData}
    />
  );
}
```

### 2. Getting Optimal Stations for Data Collection

```javascript
import { stationConfigService } from './src/services/stationConfigService.js';

// Get optimal stations for all data types
const optimalStations = stationConfigService.getOptimalStations({
  dataType: 'all',
  maxStations: 8,
  priorityOnly: false
});

// Get stations near a specific location
const nearbyStations = stationConfigService.getStationsByProximity(
  { lat: 1.3437, lng: 103.7640 }, // Hwa Chong coordinates
  10, // 10km radius
  'temperature' // specific data type
);

// Get station information
const stationInfo = stationConfigService.getStationInfo('S109');
```

### 3. Using the Interactive Map

```jsx
import StationsMapView from '../components/stations/StationsMapView.jsx';

function WeatherMap() {
  const handleStationSelect = (station) => {
    console.log('Selected station:', station);
  };

  return (
    <StationsMapView
      selectedDataTypes={['temperature', 'humidity']}
      selectedPriorities={['critical', 'high']}
      showKeyLocations={true}
      showCoverage={true}
      onStationSelect={handleStationSelect}
      height="600px"
    />
  );
}
```

### 4. Station Monitoring Integration

```jsx
import { stationMonitoringService } from '../services/stationMonitoringService.js';
import StationMonitoringDashboard from '../components/admin/StationMonitoringDashboard.jsx';

function AdminPanel() {
  useEffect(() => {
    // Start monitoring if not already active
    stationMonitoringService.startMonitoring();
    
    return () => {
      // Optionally stop monitoring on unmount
      stationMonitoringService.stopMonitoring();
    };
  }, []);

  return (
    <div>
      <h1>Weather Station Administration</h1>
      <StationMonitoringDashboard 
        autoRefresh={true}
        refreshInterval={30000}
        compact={false}
      />
    </div>
  );
}
```

## API Integration

### Running the Data Collection Scripts

```bash
# Generate/update stations database
node scripts/nea-stations-mapper.js

# Collect weather data with enhanced station selection
node scripts/enhanced-weather-collector.js
```

### GitHub Actions Integration

Update your existing workflows to use the enhanced scripts:

```yaml
# .github/workflows/collect-weather.yml
- name: Enhanced Weather Data Collection
  run: node scripts/enhanced-weather-collector.js

# Add stations database update (run weekly)
- name: Update Stations Database
  run: node scripts/nea-stations-mapper.js
  if: github.event.schedule == '0 0 * * 0'  # Weekly on Sunday
```

## Key Features and Improvements

### 1. Intelligent Station Selection
- **Proximity-based**: Prioritizes stations near key locations (Hwa Chong, Bukit Timah, Newton, Clementi)
- **Reliability-weighted**: Considers historical station performance
- **Data type optimization**: Selects best stations for each measurement type
- **Geographic coverage**: Ensures representation across all Singapore regions

### 2. Enhanced Data Quality
- **Quality scoring**: 0-100% data quality assessment
- **Geographic coverage**: Region-by-region coverage analysis
- **Station metadata**: Rich information about each station
- **Reliability tracking**: Historical performance monitoring

### 3. Real-time Monitoring
- **Station status**: Active/inactive monitoring
- **Performance alerts**: Automatic issue detection
- **Reliability scoring**: Continuous quality assessment
- **Admin dashboard**: Comprehensive monitoring interface

### 4. Comprehensive UI Components
- **Interactive map**: Visual station selection and status
- **Stations browser**: Searchable, filterable station directory
- **Enhanced dashboard**: Rich weather data with station context
- **Monitoring dashboard**: Real-time system health and analytics

## Configuration Options

### Station Selection Parameters

```javascript
const config = {
  maxStationsPerType: 8,        // Maximum stations per data type
  minStationsPerType: 3,        // Minimum stations per data type
  priorityWeights: {
    distance: 0.4,              // Weight for proximity to key locations
    reliability: 0.3,           // Weight for historical reliability
    dataTypes: 0.2,             // Weight for number of data types
    priority: 0.1               // Weight for assigned priority level
  }
};
```

### Monitoring Configuration

```javascript
const monitoringConfig = {
  monitoring_frequency: 5 * 60 * 1000,  // 5 minutes
  alert_thresholds: {
    reliability: 0.8,                    // 80% minimum reliability
    responseTime: 5000,                  // 5 seconds max response
    dataAge: 3600000,                   // 1 hour max data age
    consecutiveFailures: 3              // Alert after 3 failures
  }
};
```

## Migration from Legacy System

### Step 1: Generate Stations Database
```bash
node scripts/nea-stations-mapper.js
```

### Step 2: Update Data Collection
Replace existing weather collection with:
```bash
node scripts/enhanced-weather-collector.js
```

### Step 3: Update UI Components
```jsx
// Replace existing WeatherDashboard with EnhancedWeatherDashboard
import { EnhancedWeatherDashboard } from './components/weather/EnhancedWeatherDashboard.jsx';

// Old
<WeatherDashboard data={weatherData} />

// New
<EnhancedWeatherDashboard data={weatherData} />
```

### Step 4: Add Optional Features
- Add StationsMapView for interactive map
- Add StationsBrowser for station exploration
- Add StationMonitoringDashboard for admin features

## Performance Considerations

### Caching Strategy
- **Stations database**: Cached in memory with 30-minute TTL
- **Station configurations**: Persistent localStorage caching
- **Monitoring data**: Local storage for historical data

### API Optimization
- **Intelligent selection**: Reduces API calls by focusing on optimal stations
- **Circuit breaker**: Prevents cascade failures
- **Rate limiting**: Respects API rate limits
- **Parallel processing**: Concurrent data collection when possible

### Bundle Size Impact
- **Core enhancement**: ~50KB additional (gzipped)
- **Optional components**: Load on-demand
- **Data structures**: Optimized JSON formats
- **Tree shaking**: Unused components automatically excluded

## Troubleshooting

### Common Issues

1. **Stations database not loading**
   ```javascript
   // Check if database exists
   const healthStatus = stationConfigService.getHealthStatus();
   console.log(healthStatus);
   ```

2. **Monitoring not starting**
   ```javascript
   // Check monitoring service status
   const status = stationMonitoringService.getMonitoringStatus();
   console.log(status);
   ```

3. **Low data quality scores**
   - Check API availability
   - Verify station selection parameters
   - Review network connectivity

### Debug Commands

```javascript
// Enable verbose logging
localStorage.setItem('debug_stations', 'true');

// Clear all cached data
stationConfigService.clearCaches();
stationMonitoringService.clearMonitoringData();

// Force database reload
await stationConfigService.loadStationsDatabase();
```

## Future Enhancements

### Planned Features
1. **Predictive analytics**: Station failure prediction
2. **Machine learning**: Optimal station selection ML
3. **Real-time websockets**: Live station status updates
4. **Mobile apps**: React Native integration
5. **Historical analysis**: Long-term trend analysis

### Extension Points
- Custom station selection algorithms
- Additional data sources integration
- Advanced visualization components
- API for third-party integrations

## Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Update stations database
2. **Monthly**: Review monitoring alerts
3. **Quarterly**: Analyze station performance trends
4. **Annually**: Optimize selection algorithms

### Health Checks
```javascript
// System health overview
const health = {
  stations: stationConfigService.getHealthStatus(),
  monitoring: stationMonitoringService.getServiceHealth()
};
```

This comprehensive system transforms the Singapore Weather Cam from a basic weather display into a sophisticated, enterprise-grade weather monitoring platform with complete NEA station network integration.