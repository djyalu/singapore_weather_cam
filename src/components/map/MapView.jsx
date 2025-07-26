import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Helper function to get region colors
const getRegionColor = (colorScheme) => {
  const colorMap = {
    'primary': '#DC0032',
    'secondary': '#0EA5E9', 
    'accent': '#65a30d',
    'neutral': '#64748b',
  };
  return colorMap[colorScheme] || colorMap.primary;
};

const MapView = React.memo(({ weatherData, webcamData, selectedRegion = 'all', regionConfig = null, className = '' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const regionOverlayRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {return;}

    console.log('🗺️ MapView: Initializing map with data:', {
      weatherData: weatherData ? 'present' : 'missing',
      weatherDataStructure: weatherData ? Object.keys(weatherData) : [],
      weatherLocations: weatherData?.locations?.length || 0,
      weatherLocationsData: weatherData?.locations?.slice(0, 2), // 첫 2개 항목만 로그
      webcamData: webcamData ? 'present' : 'missing',
      webcamCaptures: webcamData?.captures?.length || 0
    });

    // Initialize map with regional configuration
    console.log('🗺️ MapView: Creating Leaflet map instance...');
    const initialCenter = regionConfig ? [regionConfig.center.lat, regionConfig.center.lng] : [1.3520, 103.7767];
    const initialZoom = regionConfig ? regionConfig.zoom : 12;
    
    const map = L.map(mapRef.current).setView(initialCenter, initialZoom);
    mapInstanceRef.current = map;
    console.log('🗺️ MapView: Map instance created successfully');

    // Add tile layer
    console.log('🗺️ MapView: Adding tile layer...');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);
    console.log('🗺️ MapView: Tile layer added successfully');

    // Add regional overlay if specific region is selected
    if (regionConfig && regionConfig.bounds && selectedRegion !== 'all') {
      console.log('🗺️ MapView: Adding regional overlay for:', selectedRegion);
      
      const { bounds } = regionConfig;
      const overlayBounds = [
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ];
      
      // Create a subtle highlight rectangle for the region
      const regionOverlay = L.rectangle(overlayBounds, {
        color: getRegionColor(regionConfig.color),
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.1,
        dashArray: '5, 5',
      }).addTo(map);
      
      regionOverlayRef.current = regionOverlay;
      
      // Add region label
      const center = [(bounds.north + bounds.south) / 2, (bounds.east + bounds.west) / 2];
      L.marker(center, {
        icon: L.divIcon({
          html: `<div class="bg-white bg-opacity-90 px-2 py-1 rounded shadow-md text-sm font-semibold text-gray-700 border">${regionConfig.name} Region</div>`,
          className: 'region-label',
          iconSize: [100, 30],
          iconAnchor: [50, 15],
        })
      }).addTo(map);
    }

    // Add weather station markers (data already transformed)
    if (weatherData?.locations) {
      console.log('🌡️ MapView: Adding weather markers for locations:', weatherData.locations.map(l => l.name));
      weatherData.locations.forEach((location) => {
        if (location.coordinates) {
          const marker = L.marker([location.coordinates.lat, location.coordinates.lng])
            .addTo(map)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-bold">${location.name}</h3>
                <p>Temperature: ${location.temperature || '--'}°C</p>
                <p>Humidity: ${location.humidity || '--'}%</p>
                <p>Rainfall: ${location.rainfall || '0'} mm</p>
              </div>
            `);

          // Add custom icon for weather stations
          const weatherIcon = L.divIcon({
            html: '<div class="bg-weather-blue text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">🌡️</div>',
            className: 'custom-div-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });
          marker.setIcon(weatherIcon);
        }
      });
    }

    // Add webcam markers
    if (webcamData?.captures) {
      webcamData.captures.forEach((webcam) => {
        if (webcam.coordinates) {
          const marker = L.marker([webcam.coordinates.lat, webcam.coordinates.lng])
            .addTo(map)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-bold">${webcam.name}</h3>
                <p>${webcam.location}</p>
                <p class="text-sm text-gray-600">${webcam.type || 'webcam'}</p>
                ${webcam.file_info?.url ?
    `<img src="${webcam.file_info.url}" 
                       alt="${webcam.name}" 
                       class="w-32 h-24 object-cover rounded mt-2" />` :
    '<div class="w-32 h-24 bg-gray-200 rounded mt-2 flex items-center justify-center text-gray-500">📷</div>'
}
                ${webcam.ai_analysis?.weather_condition ?
    `<p class="text-xs mt-2">Weather: ${webcam.ai_analysis.weather_condition}</p>` : ''
}
              </div>
            `);

          // Add custom icon for webcams
          const webcamIcon = L.divIcon({
            html: '<div class="bg-singapore-red text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">📷</div>',
            className: 'custom-div-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });
          marker.setIcon(webcamIcon);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [weatherData, webcamData]);

  // Handle region changes
  useEffect(() => {
    if (!mapInstanceRef.current || !regionConfig) return;

    console.log('🗺️ MapView: Updating map view for region:', selectedRegion);
    
    const map = mapInstanceRef.current;
    
    // Animate to new center and zoom
    map.setView([regionConfig.center.lat, regionConfig.center.lng], regionConfig.zoom, {
      animate: true,
      duration: 0.8,
    });

    // Remove previous region overlay if it exists
    if (regionOverlayRef.current) {
      map.removeLayer(regionOverlayRef.current);
      regionOverlayRef.current = null;
    }

    // Add new region overlay if not showing all
    if (regionConfig.bounds && selectedRegion !== 'all') {
      const { bounds } = regionConfig;
      const overlayBounds = [
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ];
      
      const regionOverlay = L.rectangle(overlayBounds, {
        color: getRegionColor(regionConfig.color),
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.1,
        dashArray: '5, 5',
      }).addTo(map);
      
      regionOverlayRef.current = regionOverlay;
    }
  }, [selectedRegion, regionConfig]);

  return (
    <div className={`card p-0 overflow-hidden ${className}`}>
      <div ref={mapRef} className="h-96 w-full rounded-lg" />
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-weather-blue rounded-full"></div>
              <span>Weather Stations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-singapore-red rounded-full"></div>
              <span>Webcam Locations</span>
            </div>
          </div>
          
          {selectedRegion !== 'all' && regionConfig && (
            <div className="flex items-center gap-2 text-sm">
              <div 
                className="w-4 h-4 rounded border-2 opacity-50"
                style={{ borderColor: getRegionColor(regionConfig.color) }}
              ></div>
              <span className="text-neutral-600">{regionConfig.name} Region</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MapView.propTypes = {
  selectedRegion: PropTypes.string,
  regionConfig: PropTypes.shape({
    name: PropTypes.string,
    center: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number,
    }),
    zoom: PropTypes.number,
    color: PropTypes.string,
    bounds: PropTypes.shape({
      north: PropTypes.number,
      south: PropTypes.number,
      east: PropTypes.number,
      west: PropTypes.number,
    }),
  }),
  className: PropTypes.string,
  weatherData: PropTypes.shape({
    timestamp: PropTypes.string,
    locations: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      }),
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      rainfall: PropTypes.number,
      description: PropTypes.string,
      priority: PropTypes.string,
    })),
  }),
  webcamData: PropTypes.shape({
    timestamp: PropTypes.string,
    total_cameras: PropTypes.number,
    successful_captures: PropTypes.number,
    failed_captures: PropTypes.number,
    captures: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      }),
      type: PropTypes.string,
      status: PropTypes.string,
      file_info: PropTypes.shape({
        url: PropTypes.string,
      }),
      ai_analysis: PropTypes.object,
      priority: PropTypes.string,
    })),
  }),
};

MapView.displayName = 'MapView';

export default MapView;