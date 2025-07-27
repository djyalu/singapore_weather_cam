/**
 * SafeDateFormatter Component
 * Safely formats dates for display, preventing React Date object rendering errors
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getLocalizedString } from '../../config/localization';

/**
 * Format date safely for React rendering
 * @param {Date|string|number} date - Date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDateSafely = (date, options = {}) => {
  try {
    if (!date) {
      return options.fallback || getLocalizedString('NO_DATA');
    }

    // Handle different input types
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return options.fallback || getLocalizedString('INVALID_DATE');
    }

    // Validate the date
    if (isNaN(dateObj.getTime())) {
      return options.fallback || getLocalizedString('INVALID_DATE');
    }

    // Format the date
    const locale = options.locale || 'ko-KR';
    const formatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...(options.dateOptions || {})
    };

    return dateObj.toLocaleString(locale, formatOptions);
  } catch (error) {
    // Safe fallback in case of any formatting error
    if (import.meta.env.MODE === 'development') {
      console.warn('Date formatting error:', error);
    }
    return options.fallback || getLocalizedString('DATE_FORMAT_ERROR');
  }
};

/**
 * SafeDateFormatter React Component
 */
const SafeDateFormatter = ({ 
  date, 
  locale = 'ko-KR', 
  dateOptions = {}, 
  fallback,
  className = '',
  children
}) => {
  const formattedDate = formatDateSafely(date, { 
    locale, 
    dateOptions, 
    fallback 
  });

  // If children is provided, it's a render prop pattern
  if (typeof children === 'function') {
    return children(formattedDate);
  }

  return (
    <span className={className} title={formattedDate}>
      {formattedDate}
    </span>
  );
};

SafeDateFormatter.propTypes = {
  date: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
    PropTypes.number
  ]),
  locale: PropTypes.string,
  dateOptions: PropTypes.object,
  fallback: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.func
};

/**
 * Common date format presets
 */
export const DateFormats = {
  FULL: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  },
  SHORT: {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  },
  TIME_ONLY: {
    hour: '2-digit',
    minute: '2-digit'
  },
  DATE_ONLY: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
};

/**
 * Hook for safe date formatting
 */
export const useSafeDate = (date, options = {}) => {
  return React.useMemo(() => {
    return formatDateSafely(date, options);
  }, [date, options.locale, JSON.stringify(options.dateOptions)]);
};

export default SafeDateFormatter;