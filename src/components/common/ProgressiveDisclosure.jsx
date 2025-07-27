import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Progressive Disclosure Component
 * Manages information density with expandable sections and contextual help
 */
const ProgressiveDisclosure = ({
  title,
  children,
  summary,
  helpText,
  defaultExpanded = false,
  level = 'primary', // primary, secondary, tertiary
  showCount = false,
  count = 0,
  icon: Icon,
  className = '',
  onToggle,
  disabled = false,
  variant = 'default', // default, card, minimal
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef(null);

  // Measure content height for smooth animations
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isExpanded]);

  const handleToggle = () => {
    if (disabled) return;
    
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  const baseClasses = {
    default: 'border border-gray-200 rounded-lg bg-white',
    card: 'bg-white rounded-lg shadow-sm border border-gray-100',
    minimal: 'border-b border-gray-100',
  };

  const levelClasses = {
    primary: 'text-lg font-semibold text-gray-900',
    secondary: 'text-base font-medium text-gray-800',
    tertiary: 'text-sm font-medium text-gray-700',
  };

  return (
    <div className={`${baseClasses[variant]} ${className}`}>
      {/* Header with toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full text-left p-4 flex items-center justify-between
          ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50 focus:bg-gray-50'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
          transition-colors duration-200
          touch-manipulation
        `}
        aria-expanded={isExpanded}
        aria-controls={`disclosure-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Optional icon */}
          {Icon && (
            <Icon 
              className="w-5 h-5 text-gray-500 flex-shrink-0" 
              aria-hidden="true" 
            />
          )}
          
          {/* Title and summary */}
          <div className="flex-1 min-w-0">
            <div className={`${levelClasses[level]} flex items-center space-x-2`}>
              <span className="truncate">{title}</span>
              {showCount && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {count}
                </span>
              )}
            </div>
            
            {/* Summary text when collapsed */}
            {summary && !isExpanded && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {summary}
              </p>
            )}
          </div>
        </div>

        {/* Help tooltip and expand icon */}
        <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
          {helpText && (
            <div className="relative group">
              <InformationCircleIcon 
                className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Help information"
              />
              <div className="
                absolute right-0 bottom-full mb-2 w-64 p-3 
                bg-gray-900 text-white text-sm rounded-lg
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200 z-10
                pointer-events-none
              ">
                {helpText}
                <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
          
          {isExpanded ? (
            <ChevronUpIcon 
              className="w-5 h-5 text-gray-500 transition-transform duration-200" 
              aria-hidden="true"
            />
          ) : (
            <ChevronDownIcon 
              className="w-5 h-5 text-gray-500 transition-transform duration-200" 
              aria-hidden="true"
            />
          )}
        </div>
      </button>

      {/* Expandable content */}
      <div
        id={`disclosure-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: isExpanded ? `${contentHeight}px` : '0px',
        }}
        aria-hidden={!isExpanded}
      >
        <div 
          ref={contentRef}
          className={`
            px-4 pb-4
            ${isExpanded ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-200
          `}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Disclosure Group for managing multiple related disclosures
 */
export const DisclosureGroup = ({ 
  children, 
  allowMultiple = true,
  className = '',
  spacing = 'normal' // tight, normal, relaxed
}) => {
  const [openItems, setOpenItems] = useState(new Set());

  const handleToggle = (id, isOpen) => {
    if (allowMultiple) {
      const newOpenItems = new Set(openItems);
      if (isOpen) {
        newOpenItems.add(id);
      } else {
        newOpenItems.delete(id);
      }
      setOpenItems(newOpenItems);
    } else {
      setOpenItems(isOpen ? new Set([id]) : new Set());
    }
  };

  const spacingClasses = {
    tight: 'space-y-1',
    normal: 'space-y-3',
    relaxed: 'space-y-6',
  };

  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const id = child.props.id || `disclosure-${index}`;
          return React.cloneElement(child, {
            onToggle: (isOpen) => {
              handleToggle(id, isOpen);
              child.props.onToggle?.(isOpen);
            },
            defaultExpanded: allowMultiple ? child.props.defaultExpanded : openItems.has(id),
          });
        }
        return child;
      })}
    </div>
  );
};

/**
 * Contextual Help Tooltip Component
 */
export const ContextualHelp = ({ 
  content, 
  position = 'top',
  trigger = 'hover', // hover, click, focus
  className = '',
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(null);

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const handleTrigger = (show) => {
    if (trigger === 'hover' || trigger === 'focus') {
      setIsVisible(show);
    } else if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={() => trigger === 'hover' && handleTrigger(true)}
        onMouseLeave={() => trigger === 'hover' && handleTrigger(false)}
        onFocus={() => trigger === 'focus' && handleTrigger(true)}
        onBlur={() => trigger === 'focus' && handleTrigger(false)}
        onClick={() => trigger === 'click' && handleTrigger()}
        className="cursor-help"
      >
        {children || (
          <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        )}
      </div>

      {isVisible && (
        <div className={`
          absolute ${positionClasses[position]} z-20 w-64 p-3
          bg-gray-900 text-white text-sm rounded-lg shadow-lg
          transform transition-all duration-200
          pointer-events-none
        `}>
          {content}
          <div className={`
            absolute w-0 h-0 border-4 border-transparent
            ${position === 'top' ? 'top-full border-t-gray-900' : ''}
            ${position === 'bottom' ? 'bottom-full border-b-gray-900' : ''}
            ${position === 'left' ? 'left-full border-l-gray-900' : ''}
            ${position === 'right' ? 'right-full border-r-gray-900' : ''}
          `}></div>
        </div>
      )}
    </div>
  );
};

/**
 * Onboarding Tooltip for first-time users
 */
export const OnboardingTooltip = ({
  step,
  totalSteps,
  title,
  content,
  position = 'bottom',
  onNext,
  onPrev,
  onSkip,
  onFinish,
  targetRef,
  isVisible = false,
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible && targetRef?.current) {
      const rect = targetRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      let top, left;
      
      switch (position) {
        case 'bottom':
          top = rect.bottom + scrollTop + 10;
          left = rect.left + scrollLeft + (rect.width / 2);
          break;
        case 'top':
          top = rect.top + scrollTop - 10;
          left = rect.left + scrollLeft + (rect.width / 2);
          break;
        case 'left':
          top = rect.top + scrollTop + (rect.height / 2);
          left = rect.left + scrollLeft - 10;
          break;
        case 'right':
          top = rect.top + scrollTop + (rect.height / 2);
          left = rect.right + scrollLeft + 10;
          break;
        default:
          top = rect.bottom + scrollTop + 10;
          left = rect.left + scrollLeft + (rect.width / 2);
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, targetRef, position]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed z-50 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 p-4"
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">
          {step} of {totalSteps}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-600 mb-4">{content}</p>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {step > 1 && (
            <button
              onClick={onPrev}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Previous
            </button>
          )}
          <button
            onClick={onSkip}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
          >
            Skip tour
          </button>
        </div>

        <div className="flex space-x-2">
          {step < totalSteps ? (
            <button
              onClick={onNext}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onFinish}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressiveDisclosure;