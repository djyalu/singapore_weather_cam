import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapView = ({ weatherData, webcamData }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Bukit Timah Nature Reserve
    const map = L.map(mapRef.current).setView([1.3520, 103.7767], 12);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Add weather station markers
    if (weatherData?.locations) {
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
                  `<div class="w-32 h-24 bg-gray-200 rounded mt-2 flex items-center justify-center text-gray-500">📷</div>`
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

  return (
    <div className="card p-0 overflow-hidden">
      <div ref={mapRef} className="h-96 w-full rounded-lg" />
      <div className="p-4 border-t">
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
      </div>
    </div>
  );
};

export default MapView;