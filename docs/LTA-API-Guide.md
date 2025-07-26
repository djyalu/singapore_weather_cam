# LTA Traffic Images API Integration Guide

## Overview

The Singapore LTA (Land Transport Authority) Traffic Images API provides real-time traffic camera images from across Singapore. This guide explains how to integrate and use this API in the Singapore Weather Cam project.

## API Endpoint

```
https://api.data.gov.sg/v1/transport/traffic-images
```

## API Response Structure

### Top Level
```json
{
  "items": [
    {
      "timestamp": "2025-07-26T20:15:02+08:00",
      "cameras": [...]
    }
  ],
  "api_info": {
    "status": "healthy"
  }
}
```

### Camera Object
```json
{
  "timestamp": "2025-07-26T20:12:02+08:00",
  "image": "https://images.data.gov.sg/api/traffic-images/2025/07/[uuid].jpg",
  "location": {
    "latitude": 1.29531332,
    "longitude": 103.871146
  },
  "camera_id": "1001",
  "image_metadata": {
    "height": 240,
    "width": 320,
    "md5": "f75a788f6b86915db3326f81c7d066a4"
  }
}
```

## Key Statistics

- **Total Cameras**: 104 traffic cameras
- **Image Resolutions**: 
  - Standard: 320x240 pixels
  - HD: 1920x1080 pixels
- **Update Frequency**: Every 1-5 minutes
- **Coverage**: Island-wide, including major expressways and roads

## Camera Locations

### Near Hwa Chong International School (Bukit Timah Area)

| Camera ID | Location | Coordinates | Resolution |
|-----------|----------|-------------|------------|
| 4710 | PIE (Bukit Timah) | 1.32153, 103.75273 | 1920x1080 |
| 4709 | Dunearn Road | 1.312019, 103.763002 | 1920x1080 |
| 4708 | Bukit Panjang | 1.29939, 103.7799 | 1920x1080 |
| 2703 | BKE | 1.35048, 103.79103 | 1920x1080 |

## Integration Examples

### 1. Basic API Call (JavaScript)

```javascript
async function fetchTrafficCameras() {
  try {
    const response = await fetch('https://api.data.gov.sg/v1/transport/traffic-images');
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const cameras = data.items[0].cameras;
      console.log(`Found ${cameras.length} traffic cameras`);
      return cameras;
    }
  } catch (error) {
    console.error('Error fetching traffic cameras:', error);
    return [];
  }
}
```

### 2. Filter Cameras by Location (Near Bukit Timah)

```javascript
function filterCamerasByLocation(cameras, centerLat, centerLng, radiusKm) {
  return cameras.filter(camera => {
    const distance = calculateDistance(
      centerLat, centerLng,
      camera.location.latitude, camera.location.longitude
    );
    return distance <= radiusKm;
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI/180);
}

// Example: Get cameras within 5km of Hwa Chong
const hwaChongLat = 1.32865;
const hwaChongLng = 103.80227;
const nearbyCameras = filterCamerasByLocation(cameras, hwaChongLat, hwaChongLng, 5);
```

### 3. Download and Save Images

```javascript
const fs = require('fs');
const https = require('https');
const path = require('path');

async function downloadCameraImage(camera, outputDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `camera_${camera.camera_id}_${timestamp}.jpg`;
  const filepath = path.join(outputDir, filename);
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(camera.image, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve({
          camera_id: camera.camera_id,
          filepath: filepath,
          location: camera.location,
          timestamp: camera.timestamp
        });
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}
```

### 4. Integration with Weather Data

```javascript
function enrichCameraWithWeather(camera, weatherStations) {
  // Find nearest weather station
  let nearestStation = null;
  let minDistance = Infinity;
  
  weatherStations.forEach(station => {
    const distance = calculateDistance(
      camera.location.latitude,
      camera.location.longitude,
      station.location.latitude,
      station.location.longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  });
  
  return {
    ...camera,
    weather: {
      station: nearestStation?.name,
      temperature: nearestStation?.temperature,
      humidity: nearestStation?.humidity,
      distance_km: minDistance.toFixed(2)
    }
  };
}
```

## Rate Limiting & Best Practices

1. **API Rate Limits**:
   - No official rate limit documented
   - Recommended: Max 60 requests per minute
   - Use caching to reduce API calls

2. **Image Caching**:
   ```javascript
   const imageCache = new Map();
   const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
   
   function getCachedImage(cameraId) {
     const cached = imageCache.get(cameraId);
     if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
       return cached.data;
     }
     return null;
   }
   ```

3. **Error Handling**:
   - Implement exponential backoff for failed requests
   - Have fallback data for service outages
   - Log errors for monitoring

## Query Parameters

### Date/Time Filtering
```
https://api.data.gov.sg/v1/transport/traffic-images?date_time=2025-07-26T20:00:00
```

### Response Example with Specific Time
```bash
curl "https://api.data.gov.sg/v1/transport/traffic-images?date_time=2025-07-26T20:00:00"
```

## Camera Categories by Area

### Central Region
- Orchard Road
- Marina Bay
- CBD Area

### North Region
- Woodlands
- Sembawang
- Yishun

### West Region (Including Bukit Timah)
- Jurong
- Clementi
- Bukit Panjang
- **Bukit Timah** ⭐

### East Region
- Tampines
- Bedok
- Pasir Ris

### Expressways
- PIE (Pan Island Expressway)
- CTE (Central Expressway)
- AYE (Ayer Rajah Expressway)
- BKE (Bukit Timah Expressway)
- SLE (Seletar Expressway)

## Implementation in Singapore Weather Cam

### 1. Update Data Collection Script

```javascript
// scripts/collect-traffic.js
const BUKIT_TIMAH_COORDS = { lat: 1.3520, lng: 103.7767 };
const SEARCH_RADIUS_KM = 5;

async function collectTrafficData() {
  const cameras = await fetchTrafficCameras();
  const nearbyCameras = filterCamerasByLocation(
    cameras,
    BUKIT_TIMAH_COORDS.lat,
    BUKIT_TIMAH_COORDS.lng,
    SEARCH_RADIUS_KM
  );
  
  // Save camera data
  const data = {
    timestamp: new Date().toISOString(),
    total_cameras: cameras.length,
    nearby_cameras: nearbyCameras.length,
    cameras: nearbyCameras,
    search_center: BUKIT_TIMAH_COORDS,
    search_radius_km: SEARCH_RADIUS_KM
  };
  
  fs.writeFileSync(
    'data/traffic/latest.json',
    JSON.stringify(data, null, 2)
  );
}
```

### 2. React Component Display

```jsx
// src/components/traffic/TrafficCameraCard.jsx
const TrafficCameraCard = ({ camera, weather }) => {
  return (
    <div className="rounded-lg shadow-lg overflow-hidden">
      <img 
        src={camera.image} 
        alt={`Traffic at ${camera.camera_id}`}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold">Camera {camera.camera_id}</h3>
        <p className="text-sm text-gray-600">
          Location: {camera.location.latitude.toFixed(4)}, 
          {camera.location.longitude.toFixed(4)}
        </p>
        {weather && (
          <p className="text-sm mt-2">
            Nearest Weather: {weather.temperature}°C, 
            {weather.humidity}% humidity
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Updated: {new Date(camera.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
};
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Use a proxy server or call from backend
   - Configure proper CORS headers

2. **Image Loading Failures**
   - Images expire after some time
   - Implement retry logic
   - Cache images locally

3. **API Timeout**
   - Increase timeout to 30 seconds
   - Implement circuit breaker pattern

## Additional Resources

- [Data.gov.sg API Documentation](https://data.gov.sg/developer)
- [LTA DataMall](https://datamall.lta.gov.sg/content/datamall/en.html)
- [OneMap API](https://www.onemap.gov.sg/docs/) for geocoding

## License

This API is provided by the Singapore Government under the [Singapore Open Data License](https://data.gov.sg/open-data-licence).

---

Last Updated: July 2025