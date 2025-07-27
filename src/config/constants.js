/**
 * Singapore Weather Cam - Central Configuration Constants
 * All hardcoded values extracted to centralized configuration
 */

// ===============================
// GEOGRAPHIC COORDINATES
// ===============================
export const COORDINATES = {
  // Primary monitoring location
  HWA_CHONG_SCHOOL: {
    lat: 1.3437,
    lng: 103.7640,
    name: 'Hwa Chong International School',
    description: 'Primary monitoring center for Bukit Timah region'
  },
  
  // Secondary monitoring locations
  BUKIT_TIMAH_NATURE_RESERVE: {
    lat: 1.3520,
    lng: 103.7767,
    name: 'Bukit Timah Nature Reserve',
    description: 'Secondary monitoring location'
  },
  
  NEWTON: {
    lat: 1.3138,
    lng: 103.8420,
    name: 'Newton',
    description: 'Central Singapore urban monitoring'
  },
  
  // Default map center (using Hwa Chong as primary)
  DEFAULT_CENTER: [1.3437, 103.7640],
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18,
  
  // Singapore bounds for map constraints
  SINGAPORE_BOUNDS: {
    north: 1.4504,
    south: 1.2150,
    east: 104.0446,
    west: 103.5967
  }
};

// ===============================
// WEATHER STATION CONFIGURATION
// ===============================
export const WEATHER_STATIONS = {
  PRIMARY: ['S117', 'S50', 'S106'], // Newton, Clementi, Tai Seng
  SECONDARY: ['S107', 'S43', 'S60', 'S104'],
  
  // Station coordinates
  COORDINATES: {
    S117: { lat: 1.3138, lng: 103.8420, name: 'Newton' },
    S50: { lat: 1.3162, lng: 103.7649, name: 'Clementi' },
    S106: { lat: 1.3369, lng: 103.8847, name: 'Tai Seng' },
    S107: { lat: 1.3135, lng: 103.8038, name: 'Marina Barrage' },
    S43: { lat: 1.3667, lng: 103.9833, name: 'Punggol' },
    S60: { lat: 1.3180, lng: 103.9063, name: 'Sentosa' },
    S104: { lat: 1.3337, lng: 103.7768, name: 'Tengah' }
  }
};

// ===============================
// TRAFFIC CAMERA CONFIGURATION
// ===============================
export const TRAFFIC_CAMERAS = {
  FEATURED: ['2703', '2704', '1701', '4712', '2701', '1709', '4710', '6716'],
  
  RESOLUTIONS: {
    HD: { width: 1920, height: 1080 },
    STANDARD: { width: 1280, height: 720 },
    MOBILE: { width: 640, height: 480 }
  }
};

// ===============================
// TIME INTERVALS & TIMEOUTS
// ===============================
export const INTERVALS = {
  // Data refresh intervals (milliseconds)
  APP_REFRESH: 5 * 60 * 1000,           // 5 minutes - main app refresh
  WEATHER_UPDATE: 3 * 60 * 60 * 1000,   // 3 hours - weather collection (GitHub Actions)
  WEBCAM_UPDATE: 30 * 60 * 1000,        // 30 minutes - webcam capture
  CAMERA_CACHE_TTL: 60 * 1000,          // 1 minute - camera data cache
  SYSTEM_HEALTH_CHECK: 5 * 60 * 1000,   // 5 minutes - health monitoring
  
  // UI update intervals
  REAL_TIME_UPDATE: 5 * 1000,           // 5 seconds - real-time UI updates
  PROGRESS_UPDATE: 1000,                // 1 second - progress indicators
  ANIMATION_DELAY: 100,                 // 100ms - stagger animations
};

export const TIMEOUTS = {
  // API timeouts
  API_DEFAULT: 15000,                   // 15 seconds - default API timeout
  API_FAST: 5000,                       // 5 seconds - fast API calls
  API_SLOW: 30000,                      // 30 seconds - slower operations
  
  // Circuit breaker
  CIRCUIT_BREAKER: 30000,               // 30 seconds - circuit breaker timeout
  RETRY_DELAY: 1000,                    // 1 second - retry delay
  
  // UI timeouts
  DEBOUNCE: 300,                        // 300ms - debounce user input
  TOOLTIP_DELAY: 500,                   // 500ms - tooltip show delay
  MODAL_ANIMATION: 200,                 // 200ms - modal transitions
};

// ===============================
// API ENDPOINTS
// ===============================
export const API_ENDPOINTS = {
  // Singapore Government APIs
  NEA_WEATHER: 'https://api.data.gov.sg/v1/environment',
  LTA_TRAFFIC: 'https://api.data.gov.sg/v1/transport/traffic-images',
  
  // Map tiles
  OPENSTREETMAP: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  
  // CDN resources
  LEAFLET_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4',
  
  // Backup data sources
  OPENWEATHER: 'https://api.openweathermap.org/data/2.5',
};

// ===============================
// PERFORMANCE LIMITS
// ===============================
export const LIMITS = {
  // Circuit breaker
  FAILURE_THRESHOLD: 3,                 // failures before circuit opens
  SUCCESS_THRESHOLD: 5,                 // successes to close circuit
  
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 50,
  MAX_CONCURRENT_REQUESTS: 3,
  
  // Cache limits
  MAX_CACHE_SIZE: 100,                  // maximum cached items
  MAX_CACHE_AGE: 24 * 60 * 60 * 1000,  // 24 hours cache TTL
  
  // File size limits
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,      // 5MB max image size
  MAX_LOG_ENTRIES: 1000,                // maximum log entries
  
  // Camera limits
  MAX_CAMERA_SELECTION: 20,             // maximum cameras in selector
  
  // Data quality thresholds
  MIN_DATA_QUALITY: 0.8,                // minimum acceptable data quality (80%)
  
  // Temperature thresholds (Singapore climate)
  TEMP_MIN_SINGAPORE: -10,              // minimum reasonable temperature (°C)
  TEMP_MAX_SINGAPORE: 60,               // maximum reasonable temperature (°C)
  TEMP_HOT: 35,                         // hot temperature threshold (°C)
  TEMP_WARM: 32,                        // warm temperature threshold (°C)
  TEMP_PLEASANT: 28,                    // pleasant temperature threshold (°C)
  TEMP_COOL: 24,                        // cool temperature threshold (°C)
};

// ===============================
// UI CONFIGURATION
// ===============================
export const UI_CONFIG = {
  // Navigation tabs
  DEFAULT_TAB: 'map',
  TAB_ORDER: ['dashboard', 'webcam', 'map', 'analysis'],
  
  // Loading states
  SKELETON_ITEMS: 6,                    // skeleton loader items
  LOADING_TIMEOUT: 30000,               // loading timeout before error
  
  // Responsive breakpoints (matches Tailwind)
  BREAKPOINTS: {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  
  // Touch targets (WCAG compliance)
  MIN_TOUCH_TARGET: 44,                 // 44px minimum touch target
  RECOMMENDED_TOUCH_TARGET: 48,         // 48px recommended size
};

// ===============================
// DEVELOPMENT CONFIGURATION
// ===============================
export const DEV_CONFIG = {
  // Development servers
  DEFAULT_PORT: 3000,
  VITE_PORT: 5173,
  
  // Debug settings
  ENABLE_CONSOLE_LOGS: process.env.NODE_ENV === 'development',
  ENABLE_REACT_DEV_TOOLS: process.env.NODE_ENV === 'development',
  
  // Mock data for development
  USE_MOCK_DATA: false,
  MOCK_DELAY: 1000,
};

// ===============================
// DESIGN TOKENS
// ===============================
export const DESIGN_TOKENS = {
  // Singapore theme colors
  COLORS: {
    SINGAPORE_RED: '#DC0032',
    SINGAPORE_WHITE: '#FFFFFF',
    WEATHER_BLUE: '#0EA5E9',
    WEATHER_GRAY: '#64748B',
    WEATHER_DARK: '#1E293B',
    ACCENT_GREEN: '#65a30d',
  },
  
  // Common spacing values (in rem)
  SPACING: {
    XS: '0.25rem',    // 4px
    SM: '0.5rem',     // 8px
    MD: '1rem',       // 16px
    LG: '1.5rem',     // 24px
    XL: '2rem',       // 32px
    '2XL': '3rem',    // 48px
  },
  
  // Common font sizes
  FONT_SIZES: {
    XS: '0.75rem',    // 12px
    SM: '0.875rem',   // 14px
    BASE: '1rem',     // 16px
    LG: '1.125rem',   // 18px
    XL: '1.25rem',    // 20px
    '2XL': '1.5rem',  // 24px
    '3XL': '1.875rem', // 30px
  }
};

// ===============================
// ACCESSIBILITY CONFIGURATION
// ===============================
export const A11Y_CONFIG = {
  // WCAG compliance levels
  WCAG_LEVEL: 'AA',
  
  // Keyboard navigation
  FOCUS_RING_WIDTH: 2,
  FOCUS_RING_COLOR: '#2563eb',
  
  // Screen reader
  LIVE_REGION_POLITENESS: {
    OFF: 'off',
    POLITE: 'polite',
    ASSERTIVE: 'assertive'
  },
  
  // Color contrast ratios
  CONTRAST_RATIOS: {
    NORMAL_AA: 4.5,
    NORMAL_AAA: 7,
    LARGE_AA: 3,
    LARGE_AAA: 4.5
  }
};

export default {
  COORDINATES,
  WEATHER_STATIONS,
  TRAFFIC_CAMERAS,
  INTERVALS,
  TIMEOUTS,
  API_ENDPOINTS,
  LIMITS,
  UI_CONFIG,
  DEV_CONFIG,
  DESIGN_TOKENS,
  A11Y_CONFIG
};