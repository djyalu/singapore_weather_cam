/**
 * Singapore Weather Cam - Localization Constants
 * Extracted hardcoded text strings for internationalization
 */

// ===============================
// KOREAN TRANSLATIONS (현재 기본값)
// ===============================
export const KOREAN_STRINGS = {
  // Navigation & Tabs
  DASHBOARD: '대시보드',
  WEBCAM: '웹캠', 
  MAP: '지도',
  ANALYSIS: '분석',
  TRAFFIC: '교통',
  
  // Loading & Status Messages
  LOADING_WEATHER: '날씨 데이터를 불러오는 중...',
  LOADING_WEBCAM: '웹캠 데이터를 불러오는 중...',
  LOADING_MAP: '지도를 불러오는 중...',
  LOADING_GENERAL: '로딩 중...',
  LOADING_PLEASE_WAIT: '최신 정보를 가져오는 동안 잠시 기다려 주세요',
  
  // Weather Analysis
  TEMPERATURE_TREND: '기온 트렌드',
  HUMIDITY_ANALYSIS: '습도 분석', 
  RAINFALL_PREDICTION: '강수량 예측',
  WEATHER_REFERENCE: 'Bukit Timah 기준',
  
  // Weather Status
  HIGH: '높음',
  NORMAL: '보통',
  LOW: '낮음',
  RAIN_DETECTED: '비 감지',
  CLEAR: '맑음',
  
  // Error Messages
  ERROR_WEATHER_LOAD: '날씨 데이터 로딩 실패',
  ERROR_WEBCAM_LOAD: '웹캠 데이터 로딩 실패',
  ERROR_GENERAL: '오류가 발생했습니다',
  ERROR_NETWORK: '네트워크 연결을 확인해주세요',
  
  // Actions
  REFRESH: '새로고침',
  RETRY: '다시 시도',
  CLOSE: '닫기',
  OPEN: '열기',
  VIEW_DETAILS: '자세히 보기',
  
  // Time & Updates
  LAST_UPDATE: '마지막 업데이트',
  REAL_TIME: '실시간',
  UPDATED_AGO: '전 업데이트됨',
  
  // Units
  TEMPERATURE_UNIT: '°C',
  HUMIDITY_UNIT: '%',
  RAINFALL_UNIT: 'mm',
  WIND_SPEED_UNIT: 'km/h',
  
  // Weather Terms
  HUMIDITY: '습도',
  WIND: '바람',
  FEELS_LIKE: '체감온도',
  
  // Data Status
  DATA_ERROR: '데이터 오류',
  PARTIAL_DATA: '부분 데이터',
  LIVE_DATA: '실시간 데이터',
  USING_CACHED_DATA: '캐시된 데이터 사용 중',
  DATA_MAY_BE_INACCURATE: '데이터가 부정확할 수 있음',
  
  // Locations
  CENTRAL_SINGAPORE: '중부 싱가포르',
  WESTERN_SINGAPORE: '서부 싱가포르', 
  EASTERN_SINGAPORE: '동부 싱가포르',
  NORTHERN_SINGAPORE: '북부 싱가포르',
  SOUTHERN_SINGAPORE: '남부 싱가포르',
  
  // Traffic Camera Interface
  TRAFFIC_CAMERA_VIEW: '{name} 카메라 보기',
  IMAGE_LOAD_ERROR: '이미지를 불러올 수 없습니다',
  TAP_TO_OPEN_MODAL: '탭하여 모달 열기',
  TRAFFIC_CAMERA_DESCRIPTION: '실시간 교통 카메라: {name}, 위치: {area}, 해상도: {width}×{height}픽셀. 탭하여 확대 모달 열기, 화살표 키로 탐색 가능',
  
  // Touch Interface
  TOUCH_GUIDE_TITLE: '터치 가이드',
  TOUCH_GUIDE_DESCRIPTION: '카메라를 탭하여 확대 보기 (화살표 키로 탐색, ESC로 닫기)',
  SWIPE_TO_CHANGE_MODE: '← 스와이프하여 모드 변경 →',
  
  // View Modes
  SELECTOR: '선택기',
  SELECT: '선택',
  FEATURED_LOCATIONS: '주요 지점',
  FEATURED: '주요',
  BY_REGION: '지역별',
  REGION: '지역',
  ALL: '전체',
  ALL_REGIONS: '모든 지역',
  
  // System Updates
  AUTO_REFRESH: '자동 새로고침',
  UPDATING: '업데이트 중...',
  
  // System Status Messages
  STATUS_OPERATING_NORMALLY: '정상 작동 중',
  STATUS_EXPERIENCING_ISSUES: '문제 발생 중',
  STATUS_DATA_OUTDATED: '데이터가 오래됨',
  STATUS_NOT_AVAILABLE: '사용 불가',
  STATUS_CURRENTLY_UPDATING: '현재 업데이트 중',
  STATUS_UNKNOWN: '상태 알 수 없음',
};

// ===============================
// ENGLISH TRANSLATIONS  
// ===============================
export const ENGLISH_STRINGS = {
  // Navigation & Tabs
  DASHBOARD: 'Dashboard',
  WEBCAM: 'Webcam',
  MAP: 'Map', 
  ANALYSIS: 'Analysis',
  TRAFFIC: 'Traffic',
  
  // Loading & Status Messages
  LOADING_WEATHER: 'Loading weather data...',
  LOADING_WEBCAM: 'Loading webcam data...',
  LOADING_MAP: 'Loading map...',
  LOADING_GENERAL: 'Loading...',
  
  // Weather Analysis
  TEMPERATURE_TREND: 'Temperature Trend',
  HUMIDITY_ANALYSIS: 'Humidity Analysis',
  RAINFALL_PREDICTION: 'Rainfall Prediction', 
  WEATHER_REFERENCE: 'Based on Bukit Timah region',
  
  // Weather Status
  HIGH: 'High',
  NORMAL: 'Normal', 
  LOW: 'Low',
  RAIN_DETECTED: 'Rain Detected',
  CLEAR: 'Clear',
  
  // Error Messages
  ERROR_WEATHER_LOAD: 'Failed to load weather data',
  ERROR_WEBCAM_LOAD: 'Failed to load webcam data', 
  ERROR_GENERAL: 'An error occurred',
  ERROR_NETWORK: 'Please check your network connection',
  
  // Actions
  REFRESH: 'Refresh',
  RETRY: 'Retry',
  CLOSE: 'Close',
  OPEN: 'Open',
  VIEW_DETAILS: 'View Details',
  
  // Time & Updates
  LAST_UPDATE: 'Last Update',
  REAL_TIME: 'Real-time',
  UPDATED_AGO: 'ago',
  
  // Units
  TEMPERATURE_UNIT: '°C',
  HUMIDITY_UNIT: '%', 
  RAINFALL_UNIT: 'mm',
  WIND_SPEED_UNIT: 'km/h',
  
  // Locations
  CENTRAL_SINGAPORE: 'Central Singapore',
  WESTERN_SINGAPORE: 'Western Singapore',
  EASTERN_SINGAPORE: 'Eastern Singapore', 
  NORTHERN_SINGAPORE: 'Northern Singapore',
  SOUTHERN_SINGAPORE: 'Southern Singapore',
};

// ===============================
// UI ELEMENT STRINGS
// ===============================
export const UI_STRINGS = {
  // App Title & Branding
  APP_TITLE: {
    ko: '🌤️ Singapore Weather Cam',
    en: '🌤️ Singapore Weather Cam'
  },
  
  APP_SUBTITLE: {
    ko: 'Enterprise Weather Monitoring System',
    en: 'Enterprise Weather Monitoring System'
  },
  
  // Icons & Emojis (language-neutral but centralized)
  ICONS: {
    WEATHER: '🌤️',
    WEBCAM: '📹', 
    MAP: '🗺️',
    ANALYSIS: '📊',
    TRAFFIC: '🚗',
    TEMPERATURE: '🌡️',
    HUMIDITY: '💧',
    RAINFALL: '🌧️',
    WIND: '💨',
    REFRESH: '🔄',
    ERROR: '⚠️',
    SUCCESS: '✅',
    LOADING: '⏳',
    LOCATION: '📍',
    TARGET: '🎯',
    STAR: '⭐',
    LIGHTBULB: '💡',
    LIVE_DOT: '●',
  },
  
  // Accessibility Labels
  ARIA_LABELS: {
    ko: {
      WEATHER_CARD: '날씨 정보 카드',
      WEBCAM_IMAGE: '웹캠 이미지',
      MAP_CONTAINER: '지도 컨테이너',
      REFRESH_BUTTON: '새로고침 버튼',
      CLOSE_MODAL: '모달 닫기',
      NAVIGATION_TAB: '네비게이션 탭',
    },
    en: {
      WEATHER_CARD: 'Weather information card',
      WEBCAM_IMAGE: 'Webcam image', 
      MAP_CONTAINER: 'Map container',
      REFRESH_BUTTON: 'Refresh button',
      CLOSE_MODAL: 'Close modal',
      NAVIGATION_TAB: 'Navigation tab',
    }
  },
  
  // Status Messages
  STATUS_MESSAGES: {
    ko: {
      ONLINE: '온라인',
      OFFLINE: '오프라인',
      CONNECTING: '연결 중...',
      CONNECTED: '연결됨',
      DISCONNECTED: '연결 끊김',
      SYNCING: '동기화 중...',
      SYNCED: '동기화됨',
    },
    en: {
      ONLINE: 'Online',
      OFFLINE: 'Offline', 
      CONNECTING: 'Connecting...',
      CONNECTED: 'Connected',
      DISCONNECTED: 'Disconnected',
      SYNCING: 'Syncing...',
      SYNCED: 'Synced',
    }
  }
};

// ===============================
// DATE & TIME FORMATTING
// ===============================
export const DATE_TIME_FORMATS = {
  ko: {
    FULL_DATE: 'YYYY년 MM월 DD일',
    SHORT_DATE: 'MM/DD',
    TIME_24H: 'HH:mm',
    TIME_12H: 'hh:mm A',
    DATETIME: 'YYYY-MM-DD HH:mm',
    RELATIVE_TIME: {
      JUST_NOW: '방금 전',
      MINUTES_AGO: '분 전',
      HOURS_AGO: '시간 전',
      DAYS_AGO: '일 전',
    }
  },
  en: {
    FULL_DATE: 'MMMM DD, YYYY',
    SHORT_DATE: 'MM/DD',
    TIME_24H: 'HH:mm', 
    TIME_12H: 'hh:mm A',
    DATETIME: 'YYYY-MM-DD HH:mm',
    RELATIVE_TIME: {
      JUST_NOW: 'just now',
      MINUTES_AGO: 'minutes ago',
      HOURS_AGO: 'hours ago', 
      DAYS_AGO: 'days ago',
    }
  }
};

// ===============================
// HELPER FUNCTIONS
// ===============================

/**
 * Get localized string based on current language
 * @param {string} key - String key
 * @param {string} lang - Language code ('ko' | 'en')
 * @returns {string} Localized string
 */
export const getLocalizedString = (key, lang = 'ko') => {
  const strings = lang === 'en' ? ENGLISH_STRINGS : KOREAN_STRINGS;
  return strings[key] || key;
};

/**
 * Get UI string with fallback
 * @param {string} category - UI category (APP_TITLE, ICONS, etc.)
 * @param {string} key - String key
 * @param {string} lang - Language code
 * @returns {string} Localized UI string
 */
export const getUIString = (category, key, lang = 'ko') => {
  const categoryStrings = UI_STRINGS[category];
  if (!categoryStrings) return key;
  
  if (typeof categoryStrings[key] === 'object') {
    return categoryStrings[key][lang] || categoryStrings[key]['ko'] || key;
  }
  
  return categoryStrings[key] || key;
};

// ===============================
// EXPORTS
// ===============================
export default {
  KOREAN_STRINGS,
  ENGLISH_STRINGS,
  UI_STRINGS,
  DATE_TIME_FORMATS,
  getLocalizedString,
  getUIString
};