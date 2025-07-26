// Singapore Traffic Camera Service using data.gov.sg API
const TRAFFIC_API_URL = 'https://api.data.gov.sg/v1/transport/traffic-images';

// Popular camera locations mapping
const CAMERA_LOCATIONS = {
  // Major Expressways
  '1701': { name: 'Woodlands Causeway', area: 'Causeway' },
  '1702': { name: 'Woodlands Checkpoint', area: 'Checkpoint' },
  '1703': { name: 'BKE Woodlands Flyover', area: 'BKE' },
  '1704': { name: 'BKE Dairy Farm Flyover', area: 'BKE' },
  '1705': { name: 'BKE Sungei Kadut Flyover', area: 'BKE' },
  '1706': { name: 'BKE Mandai Flyover', area: 'BKE' },
  '1707': { name: 'KJE BC Exit', area: 'KJE' },
  '1709': { name: 'Changi Airport', area: 'Changi' },
  '2701': { name: 'Sentosa Gateway', area: 'Sentosa' },
  '2702': { name: 'West Coast Highway', area: 'West Coast' },
  '2703': { name: 'ECP Marina Bay', area: 'Marina Bay' },
  '2704': { name: 'Orchard Boulevard', area: 'Orchard' },
  '2705': { name: 'Marina Coastal Drive', area: 'Marina' },
  '2706': { name: 'ECP Fort Road', area: 'ECP' },
  '2707': { name: 'Fullerton Road', area: 'CBD' },
  '2708': { name: 'Marina Boulevard', area: 'Marina' },
  '3701': { name: 'Central Boulevard', area: 'CBD' },
  '3702': { name: 'PIE Tuas', area: 'PIE' },
  '3704': { name: 'PIE Kim Keat', area: 'PIE' },
  '3705': { name: 'PIE Eunos', area: 'PIE' },
  '4701': { name: 'AYE After Tuas', area: 'AYE' },
  '4702': { name: 'AYE Keppel', area: 'AYE' },
  '4703': { name: 'TPE Punggol', area: 'TPE' },
  '4704': { name: 'TPE Seletar', area: 'TPE' },
  '4705': { name: 'TPE Sengkang', area: 'TPE' },
  '4706': { name: 'TPE Tampines', area: 'TPE' },
  '4707': { name: 'CTE Braddell', area: 'CTE' },
  '4708': { name: 'CTE Ang Mo Kio', area: 'CTE' },
  '4709': { name: 'CTE Yishun', area: 'CTE' },
  '4710': { name: 'Tuas Second Link', area: 'Tuas' },
  '4712': { name: 'MCE Marina Bay', area: 'MCE' },
  '4713': { name: 'MCE Maxwell', area: 'MCE' },
  '4714': { name: 'MCE MBFC', area: 'MCE' },
  '4716': { name: 'MCE Bayfront', area: 'MCE' },
  '5794': { name: 'EMAS Woodlands', area: 'North' },
  '5795': { name: 'EMAS Yishun', area: 'North' },
  '5796': { name: 'EMAS Bishan', area: 'Central' },
  '5797': { name: 'EMAS Bukit Panjang', area: 'West' },
  '5798': { name: 'EMAS Jurong', area: 'West' },
  '5799': { name: 'Tuas View Extension', area: 'Tuas' },
  '6701': { name: 'BKE Chantek Flyover', area: 'BKE' },
  '6702': { name: 'PIE Mount Pleasant', area: 'PIE' },
  '6703': { name: 'PIE Woodsville', area: 'PIE' },
  '6704': { name: 'PIE Bedok North', area: 'PIE' },
  '6705': { name: 'PIE Eunos Flyover', area: 'PIE' },
  '6706': { name: 'PIE Paya Lebar', area: 'PIE' },
  '6708': { name: 'PIE Toa Payoh', area: 'PIE' },
  '6710': { name: 'PIE Bukit Timah', area: 'PIE' },
  '6711': { name: 'PIE Clementi', area: 'PIE' },
  '6712': { name: 'PIE Jurong', area: 'PIE' },
  '6713': { name: 'PIE Bukit Batok', area: 'PIE' },
  '6714': { name: 'PIE BKE', area: 'PIE' },
  '6715': { name: 'PIE Tuas Flyover', area: 'PIE' },
  '6716': { name: 'PIE Nanyang Flyover', area: 'PIE' },
  '7791': { name: 'Woodlands Avenue 12', area: 'Woodlands' },
  '7793': { name: 'Loyang Avenue', area: 'East' },
  '7794': { name: 'Upp Changi Road', area: 'East' },
  '7795': { name: 'Changi Coast Road', area: 'East' },
  '7796': { name: 'Tanah Merah Coast', area: 'East' },
  '7797': { name: 'ECP Changi Link', area: 'ECP' },
  '7798': { name: 'Marine Parade Road', area: 'East Coast' },
  '8701': { name: 'AYE MCE', area: 'AYE' },
  '8702': { name: 'SLE Lentor', area: 'SLE' },
  '8704': { name: 'SLE Marsiling', area: 'SLE' },
  '8706': { name: 'SLE Woodlands South', area: 'SLE' },
  '9701': { name: 'Admiralty Road', area: 'North' },
  '9702': { name: 'Upp Thomson Road', area: 'Central' },
  '9703': { name: 'SLE Mandai Lake', area: 'SLE' },
  '9704': { name: 'SLE Seletar', area: 'SLE' },
  '9705': { name: 'TPE Pasir Ris', area: 'TPE' },
  '9706': { name: 'Loyang Avenue Flyover', area: 'East' }
};

export const fetchTrafficCameras = async () => {
  try {
    const response = await fetch(TRAFFIC_API_URL);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('No traffic camera data available');
    }

    // Get the most recent data
    const latestItem = data.items[0];
    const { timestamp, cameras } = latestItem;

    // Process cameras with location info
    const processedCameras = cameras.map(camera => {
      const locationInfo = CAMERA_LOCATIONS[camera.camera_id] || {
        name: `Camera ${camera.camera_id}`,
        area: 'Unknown'
      };

      return {
        id: camera.camera_id,
        name: locationInfo.name,
        area: locationInfo.area,
        location: {
          latitude: camera.location.latitude,
          longitude: camera.location.longitude
        },
        image: {
          url: camera.image,
          width: camera.image_metadata.width,
          height: camera.image_metadata.height,
          md5: camera.image_metadata.md5
        },
        timestamp: camera.timestamp
      };
    });

    return {
      timestamp,
      totalCameras: processedCameras.length,
      cameras: processedCameras
    };
  } catch (error) {
    console.error('Error fetching traffic cameras:', error);
    throw error;
  }
};

// Filter cameras by area or expressway
export const filterCamerasByArea = (cameras, area) => {
  if (!area || area === 'all') return cameras;
  return cameras.filter(camera => 
    camera.area.toLowerCase().includes(area.toLowerCase())
  );
};

// Get camera by ID
export const getCameraById = (cameras, cameraId) => {
  return cameras.find(camera => camera.id === cameraId);
};

// Group cameras by area
export const groupCamerasByArea = (cameras) => {
  return cameras.reduce((grouped, camera) => {
    if (!grouped[camera.area]) {
      grouped[camera.area] = [];
    }
    grouped[camera.area].push(camera);
    return grouped;
  }, {});
};

// Get popular/featured cameras
export const getFeaturedCameras = (cameras) => {
  const featuredIds = ['2703', '2704', '1701', '4712', '2701', '1709', '4710', '6716'];
  return cameras.filter(camera => featuredIds.includes(camera.id));
};