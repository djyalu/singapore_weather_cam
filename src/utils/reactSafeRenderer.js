/**
 * React Safe Renderer Utilities
 * Prevents React rendering errors from invalid object/Date rendering
 */

/**
 * Safely convert any value to a string for React rendering
 * @param {any} value - Value to render safely
 * @param {object} options - Rendering options
 * @returns {string} Safe string for rendering
 */
export const safeRender = (value, options = {}) => {
  const { fallback = '', dateFormat = 'ko-KR', maxLength = 1000 } = options;

  try {
    // Handle null/undefined
    if (value == null) {
      return fallback;
    }

    // Handle Date objects
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return fallback || 'Invalid Date';
      }
      return value.toLocaleString(dateFormat);
    }

    // Handle plain objects (prevent [object Object])
    if (typeof value === 'object' && value.constructor === Object) {
      try {
        return JSON.stringify(value);
      } catch {
        return fallback || '[Object]';
      }
    }

    // Handle arrays
    if (Array.isArray(value)) {
      try {
        return value.join(', ');
      } catch {
        return fallback || '[Array]';
      }
    }

    // Handle functions
    if (typeof value === 'function') {
      return fallback || '[Function]';
    }

    // Convert to string and limit length
    const stringValue = String(value);
    return stringValue.length > maxLength
      ? `${stringValue.substring(0, maxLength)}...`
      : stringValue;

  } catch (error) {
    // Fallback for any conversion errors
    if (import.meta.env.MODE === 'development') {
      console.warn('safeRender error:', error);
    }
    return fallback || '[Render Error]';
  }
};

/**
 * Safe number rendering with fallback
 * @param {any} value - Numeric value
 * @param {object} options - Options for formatting
 * @returns {string} Formatted number string
 */
export const safeNumber = (value, options = {}) => {
  const { fallback = '0', decimals = 1, suffix = '' } = options;

  try {
    const num = Number(value);
    if (isNaN(num)) {
      return fallback;
    }
    return `${num.toFixed(decimals)}${suffix}`;
  } catch {
    return fallback;
  }
};

/**
 * Safe percentage rendering
 * @param {any} value - Percentage value (0-100 or 0-1)
 * @param {object} options - Formatting options
 * @returns {string} Formatted percentage
 */
export const safePercentage = (value, options = {}) => {
  const { fallback = '0%', isDecimal = false } = options;

  try {
    const num = Number(value);
    if (isNaN(num)) {
      return fallback;
    }

    const percentage = isDecimal ? num * 100 : num;
    return `${Math.round(percentage)}%`;
  } catch {
    return fallback;
  }
};

/**
 * Safe array rendering with separators
 * @param {any} value - Array value
 * @param {object} options - Rendering options
 * @returns {string} Joined array string
 */
export const safeArray = (value, options = {}) => {
  const { separator = ', ', fallback = '', maxItems = 10 } = options;

  try {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const items = value.slice(0, maxItems).map(item => safeRender(item));
    const result = items.join(separator);

    if (value.length > maxItems) {
      return `${result} ... (+${value.length - maxItems} more)`;
    }

    return result;
  } catch {
    return fallback;
  }
};

/**
 * React component wrapper for safe rendering
 */
import React from 'react';
import PropTypes from 'prop-types';

export const SafeText = ({ children, fallback = '', ...options }) => {
  const safeContent = safeRender(children, { fallback, ...options });
  return <span>{safeContent}</span>;
};

SafeText.propTypes = {
  children: PropTypes.any,
  fallback: PropTypes.string,
  dateFormat: PropTypes.string,
  maxLength: PropTypes.number,
};

/**
 * Type guards for React prop validation
 */
export const TypeGuards = {
  isValidDate: (value) => value instanceof Date && !isNaN(value.getTime()),
  isValidString: (value) => typeof value === 'string' && value.length > 0,
  isValidNumber: (value) => typeof value === 'number' && !isNaN(value),
  isValidObject: (value) => value != null && typeof value === 'object',
  isValidArray: (value) => Array.isArray(value) && value.length > 0,
};

/**
 * Property validators for components
 */
export const PropValidators = {
  safeDate: (props, propName, componentName) => {
    const value = props[propName];
    if (value != null && !TypeGuards.isValidDate(value) && typeof value !== 'string') {
      return new Error(
        `Invalid prop \`${propName}\` of type \`${typeof value}\` supplied to \`${componentName}\`, expected \`Date\` or \`string\`.`,
      );
    }
  },

  safeString: (props, propName, componentName) => {
    const value = props[propName];
    if (value != null && typeof value !== 'string') {
      return new Error(
        `Invalid prop \`${propName}\` of type \`${typeof value}\` supplied to \`${componentName}\`, expected \`string\`.`,
      );
    }
  },
};

export default {
  safeRender,
  safeNumber,
  safePercentage,
  safeArray,
  SafeText,
  TypeGuards,
  PropValidators,
};