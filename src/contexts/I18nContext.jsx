import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Internationalization Context
 * Provides multi-language support with localization features
 */

// Supported languages and locales
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    direction: 'ltr',
    flag: '🇰🇷',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    direction: 'ltr',
    flag: '🇨🇳',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    flag: '🇯🇵',
  },
  ms: {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    direction: 'ltr',
    flag: '🇲🇾',
  },
};

// Translation strings
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.weather': 'Weather',
    'nav.webcam': 'Webcam',
    'nav.traffic': 'Traffic',
    'nav.analysis': 'Analysis',

    // Header
    'header.title': 'Singapore Weather Cam',
    'header.subtitle': 'Real-time weather information and webcam feeds',
    'header.lastUpdate': 'Last updated',
    'header.refresh': 'Refresh',
    'header.settings': 'Settings',

    // Weather
    'weather.temperature': 'Temperature',
    'weather.humidity': 'Humidity',
    'weather.rainfall': 'Rainfall',
    'weather.windSpeed': 'Wind Speed',
    'weather.airQuality': 'Air Quality',
    'weather.feels_like': 'Feels like',
    'weather.min': 'Min',
    'weather.max': 'Max',
    'weather.current': 'Current',
    'weather.forecast': 'Forecast',

    // Webcam
    'webcam.title': 'Live Webcam Feeds',
    'webcam.trafficCameras': 'Traffic Cameras',
    'webcam.viewLarge': 'View Large',
    'webcam.download': 'Download',
    'webcam.lastCaptured': 'Last captured',
    'webcam.noImage': 'No image available',
    'webcam.loading': 'Loading webcam feed...',

    // Traffic
    'traffic.conditions': 'Traffic Conditions',
    'traffic.smooth': 'Smooth',
    'traffic.heavy': 'Heavy',
    'traffic.congested': 'Congested',
    'traffic.roadwork': 'Road Work',

    // Analysis
    'analysis.title': 'Weather Analysis',
    'analysis.trends': 'Trends',
    'analysis.insights': 'Insights',
    'analysis.aiGenerated': 'AI Generated Analysis',

    // Time and Date
    'time.now': 'Now',
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    'time.tomorrow': 'Tomorrow',
    'time.thisWeek': 'This Week',
    'time.ago': 'ago',
    'time.minutes': 'minutes',
    'time.hours': 'hours',
    'time.days': 'days',

    // Status
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.loading': 'Loading',
    'status.error': 'Error',
    'status.success': 'Success',
    'status.warning': 'Warning',

    // Actions
    'action.close': 'Close',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.save': 'Save',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.view': 'View',
    'action.retry': 'Retry',
    'action.refresh': 'Refresh',

    // Accessibility
    'a11y.skipToContent': 'Skip to main content',
    'a11y.menu': 'Main menu',
    'a11y.loading': 'Loading',
    'a11y.closeDialog': 'Close dialog',
    'a11y.expandMenu': 'Expand menu',
    'a11y.collapseMenu': 'Collapse menu',

    // Errors
    'error.generic': 'An error occurred',
    'error.network': 'Network error. Please check your connection.',
    'error.timeout': 'Request timeout. Please try again.',
    'error.notFound': 'Data not found',
    'error.serverError': 'Server error. Please try again later.',

    // Units
    'units.celsius': '°C',
    'units.fahrenheit': '°F',
    'units.kmh': 'km/h',
    'units.ms': 'm/s',
    'units.mm': 'mm',
    'units.percent': '%',
    'units.hpa': 'hPa',
  },

  ko: {
    // Navigation
    'nav.home': '홈',
    'nav.weather': '날씨',
    'nav.webcam': '웹캠',
    'nav.traffic': '교통',
    'nav.analysis': '분석',

    // Header
    'header.title': '싱가포르 날씨 캠',
    'header.subtitle': '실시간 날씨 정보와 웹캠 영상',
    'header.lastUpdate': '마지막 업데이트',
    'header.refresh': '새로고침',
    'header.settings': '설정',

    // Weather
    'weather.temperature': '기온',
    'weather.humidity': '습도',
    'weather.rainfall': '강수량',
    'weather.windSpeed': '풍속',
    'weather.airQuality': '대기질',
    'weather.feels_like': '체감온도',
    'weather.min': '최저',
    'weather.max': '최고',
    'weather.current': '현재',
    'weather.forecast': '예보',

    // Webcam
    'webcam.title': '실시간 웹캠',
    'webcam.trafficCameras': '교통 카메라',
    'webcam.viewLarge': '크게 보기',
    'webcam.download': '다운로드',
    'webcam.lastCaptured': '마지막 촬영',
    'webcam.noImage': '이미지 없음',
    'webcam.loading': '웹캠 영상 로딩 중...',

    // Traffic
    'traffic.conditions': '교통 상황',
    'traffic.smooth': '원활',
    'traffic.heavy': '혼잡',
    'traffic.congested': '정체',
    'traffic.roadwork': '도로공사',

    // Analysis
    'analysis.title': '날씨 분석',
    'analysis.trends': '동향',
    'analysis.insights': '인사이트',
    'analysis.aiGenerated': 'AI 생성 분석',

    // Time and Date
    'time.now': '지금',
    'time.today': '오늘',
    'time.yesterday': '어제',
    'time.tomorrow': '내일',
    'time.thisWeek': '이번 주',
    'time.ago': '전',
    'time.minutes': '분',
    'time.hours': '시간',
    'time.days': '일',

    // Status
    'status.online': '온라인',
    'status.offline': '오프라인',
    'status.loading': '로딩 중',
    'status.error': '오류',
    'status.success': '성공',
    'status.warning': '경고',

    // Actions
    'action.close': '닫기',
    'action.cancel': '취소',
    'action.confirm': '확인',
    'action.save': '저장',
    'action.delete': '삭제',
    'action.edit': '편집',
    'action.view': '보기',
    'action.retry': '다시 시도',
    'action.refresh': '새로고침',

    // Accessibility
    'a11y.skipToContent': '본문으로 건너뛰기',
    'a11y.menu': '메인 메뉴',
    'a11y.loading': '로딩 중',
    'a11y.closeDialog': '대화상자 닫기',
    'a11y.expandMenu': '메뉴 펼치기',
    'a11y.collapseMenu': '메뉴 접기',

    // Errors
    'error.generic': '오류가 발생했습니다',
    'error.network': '네트워크 오류입니다. 연결을 확인해주세요.',
    'error.timeout': '요청 시간이 초과되었습니다. 다시 시도해주세요.',
    'error.notFound': '데이터를 찾을 수 없습니다',
    'error.serverError': '서버 오류입니다. 나중에 다시 시도해주세요.',

    // Units
    'units.celsius': '°C',
    'units.fahrenheit': '°F',
    'units.kmh': 'km/h',
    'units.ms': 'm/s',
    'units.mm': 'mm',
    'units.percent': '%',
    'units.hpa': 'hPa',
  },
};

const I18nContext = createContext(null);

/**
 * I18n Provider Component
 */
export const I18nProvider = ({ children, defaultLanguage = 'ko' }) => {
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [isLoading, setIsLoading] = useState(false);

  // Detect browser language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (SUPPORTED_LANGUAGES[browserLang]) {
        setCurrentLanguage(browserLang);
      }
    }
  }, []);

  // Update document language attribute
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = SUPPORTED_LANGUAGES[currentLanguage]?.direction || 'ltr';
  }, [currentLanguage]);

  // Translation function
  const t = useCallback((key, params = {}) => {
    const translation = translations[currentLanguage]?.[key] || translations.en[key] || key;

    // Simple parameter replacement
    return Object.keys(params).reduce((str, param) => {
      return str.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    }, translation);
  }, [currentLanguage]);

  // Change language
  const changeLanguage = useCallback(async (languageCode) => {
    if (!SUPPORTED_LANGUAGES[languageCode]) {
      console.warn(`Unsupported language: ${languageCode}`);
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, you might load translations from a server here
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async loading

      setCurrentLanguage(languageCode);
      localStorage.setItem('preferred-language', languageCode);

      // Announce language change for screen readers
      const announcement = t('status.success') + ': ' + SUPPORTED_LANGUAGES[languageCode].nativeName;
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.className = 'sr-only';
      announcer.textContent = announcement;
      document.body.appendChild(announcer);

      setTimeout(() => {
        document.body.removeChild(announcer);
      }, 1000);

    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Format date/time based on locale
  const formatDate = useCallback((date, options = {}) => {
    const locale = SUPPORTED_LANGUAGES[currentLanguage]?.code || 'en';
    return new Intl.DateTimeFormat(locale, options).format(new Date(date));
  }, [currentLanguage]);

  // Format numbers based on locale
  const formatNumber = useCallback((number, options = {}) => {
    const locale = SUPPORTED_LANGUAGES[currentLanguage]?.code || 'en';
    return new Intl.NumberFormat(locale, options).format(number);
  }, [currentLanguage]);

  // Format relative time (e.g., "2 minutes ago")
  const formatRelativeTime = useCallback((date) => {
    const now = new Date();
    const target = new Date(date);
    const diffInSeconds = Math.floor((now - target) / 1000);

    if (diffInSeconds < 60) {
      return t('time.now');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${t('time.minutes')} ${t('time.ago')}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${t('time.hours')} ${t('time.ago')}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${t('time.days')} ${t('time.ago')}`;
    }
  }, [t]);

  // Get available languages
  const getAvailableLanguages = useCallback(() => {
    return Object.values(SUPPORTED_LANGUAGES);
  }, []);

  // Check if language is RTL
  const isRTL = useCallback(() => {
    return SUPPORTED_LANGUAGES[currentLanguage]?.direction === 'rtl';
  }, [currentLanguage]);

  const value = {
    // Current state
    currentLanguage,
    currentLanguageInfo: SUPPORTED_LANGUAGES[currentLanguage],
    isLoading,
    isRTL: isRTL(),

    // Translation functions
    t,
    translate: t, // alias

    // Language management
    changeLanguage,
    getAvailableLanguages,

    // Formatting functions
    formatDate,
    formatNumber,
    formatRelativeTime,

    // Utilities
    isRTL,
    getSupportedLanguages: () => SUPPORTED_LANGUAGES,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Hook to use I18n context
 */
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

/**
 * Higher-order component for I18n
 */
export const withI18n = (Component) => {
  return function I18nComponent(props) {
    const i18n = useI18n();
    return <Component {...props} i18n={i18n} />;
  };
};

/**
 * Translation helper component
 */
export const Trans = ({ i18nKey, values = {}, children }) => {
  const { t } = useI18n();

  if (children) {
    // For complex translations with nested components
    return children;
  }

  return t(i18nKey, values);
};

export default I18nContext;