// Singapore Webcam Sources Configuration
export const webcamSources = {
  // LTA Official Traffic Cameras
  lta: {
    name: "LTA Singapore",
    type: "traffic",
    cameras: [
      {
        id: "adam_road",
        name: "Adam Road",
        location: "PIE (Adam Road Exit)",
        coordinates: { lat: 1.3238, lng: 103.8140 },
        imageUrl: "https://odis.sgp1.digitaloceanspaces.com/node/adam_road",
        updateInterval: 60000 // 1 minute
      },
      {
        id: "bukit_timah",
        name: "Bukit Timah",
        location: "PIE (Bukit Timah Exit)",
        coordinates: { lat: 1.3462, lng: 103.7833 },
        imageUrl: "https://odis.sgp1.digitaloceanspaces.com/node/bukit_timah",
        updateInterval: 60000
      },
      {
        id: "stevens_road",
        name: "Stevens Road",
        location: "PIE (Stevens Road)",
        coordinates: { lat: 1.3225, lng: 103.8267 },
        imageUrl: "https://odis.sgp1.digitaloceanspaces.com/node/stevens",
        updateInterval: 60000
      }
    ]
  },

  // OneMotoring Traffic Cameras
  oneMotoring: {
    name: "OneMotoring LTA",
    type: "traffic",
    baseUrl: "https://onemotoring.lta.gov.sg",
    cameras: [
      {
        id: "pie_tuas",
        name: "PIE towards Tuas",
        location: "Pan Island Expressway",
        coordinates: { lat: 1.3199, lng: 103.6959 },
        path: "/content/onemotoring/home/driving/traffic_information/traffic-cameras/pie.html"
      },
      {
        id: "tpe_seletar",
        name: "TPE Seletar",
        location: "Tampines Expressway",
        coordinates: { lat: 1.3915, lng: 103.8600 },
        path: "/content/onemotoring/home/driving/traffic_information/traffic-cameras/tpe.html"
      }
    ]
  },

  // Alternative Sources
  alternatives: [
    {
      name: "Trafficiti",
      url: "https://www.trafficiti.com/pie/",
      description: "Real-time traffic camera views"
    },
    {
      name: "MySGRoad",
      url: "https://www.mysgroad.com/traffic-cam/",
      description: "Singapore road traffic cameras"
    }
  ]
};

// Helper function to get image URL with timestamp
export const getWebcamImageUrl = (url) => {
  const timestamp = Date.now();
  return `${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;
};

// Sample weather webcam locations (potential sources)
export const weatherWebcams = [
  {
    id: "marina_bay_sands",
    name: "Marina Bay Sands",
    location: "Marina Bay",
    coordinates: { lat: 1.2834, lng: 103.8607 },
    type: "weather",
    description: "View of Marina Bay area weather conditions"
  },
  {
    id: "sentosa_beach",
    name: "Sentosa Beach",
    location: "Sentosa Island",
    coordinates: { lat: 1.2494, lng: 103.8303 },
    type: "weather",
    description: "Beach weather conditions"
  },
  {
    id: "changi_coast",
    name: "Changi Coast",
    location: "East Coast",
    coordinates: { lat: 1.3892, lng: 103.9906 },
    type: "weather",
    description: "Eastern coastal weather"
  }
];