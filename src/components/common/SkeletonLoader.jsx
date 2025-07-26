import React from 'react';
import PropTypes from 'prop-types';

/**
 * SkeletonLoader Component
 *
 * A flexible, performant skeleton loading system for all components
 * Features:
 * - GPU-accelerated shimmer animations
 * - Configurable shapes and sizes
 * - Accessibility compliant
 * - Reduced motion support
 * - Staggered loading animations
 */

// Base skeleton element with shimmer effect
const SkeletonElement = React.memo(({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular',
  delay = 0,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-lg';
      case 'text':
        return 'rounded';
      default:
        return 'rounded-md';
    }
  };

  return (
    <div
      className={`
        skeleton-element bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 
        animate-shimmer bg-[length:200%_100%] ${getVariantClass()} ${className}
      `}
      style={{
        width,
        height,
        animationDelay: `${delay}ms`,
        animationDuration: '1.5s',
        animationIterationCount: 'infinite',
      }}
      role="status"
      aria-hidden="true"
      {...props}
    />
  );
});

// Skeleton components for specific UI patterns
const SkeletonText = React.memo(({ lines = 1, spacing = 'normal', delay = 0 }) => {
  const getSpacing = () => {
    switch (spacing) {
      case 'tight': return 'space-y-1';
      case 'loose': return 'space-y-3';
      default: return 'space-y-2';
    }
  };

  return (
    <div className={getSpacing()}>
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonElement
          key={index}
          height="0.875rem"
          width={index === lines - 1 && lines > 1 ? '75%' : '100%'}
          variant="text"
          delay={delay + (index * 100)}
        />
      ))}
    </div>
  );
});

const SkeletonCard = React.memo(({
  hasImage = true,
  hasTitle = true,
  hasSubtitle = true,
  hasActions = false,
  delay = 0,
}) => (
  <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden animate-pulse-slow"
    style={{ animationDelay: `${delay}ms` }}>
    {hasImage && (
      <SkeletonElement
        height="12rem"
        variant="rectangular"
        className="w-full"
        delay={delay}
      />
    )}
    <div className="p-4 space-y-3">
      {hasTitle && (
        <SkeletonElement
          height="1.25rem"
          width="75%"
          delay={delay + 100}
        />
      )}
      {hasSubtitle && (
        <SkeletonText
          lines={2}
          spacing="tight"
          delay={delay + 200}
        />
      )}
      {hasActions && (
        <div className="flex justify-between items-center pt-2">
          <SkeletonElement
            height="1rem"
            width="5rem"
            delay={delay + 300}
          />
          <SkeletonElement
            height="2rem"
            width="4rem"
            variant="rounded"
            delay={delay + 350}
          />
        </div>
      )}
    </div>
  </div>
));

const SkeletonAvatar = React.memo(({ size = 'md', delay = 0 }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8';
      case 'lg': return 'w-16 h-16';
      case 'xl': return 'w-20 h-20';
      default: return 'w-12 h-12';
    }
  };

  return (
    <SkeletonElement
      width="auto"
      height="auto"
      variant="circular"
      className={getSizeClass()}
      delay={delay}
    />
  );
});

const SkeletonButton = React.memo(({ size = 'md', width = 'auto', delay = 0 }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-8 px-3';
      case 'lg': return 'h-12 px-6';
      default: return 'h-10 px-4';
    }
  };

  return (
    <SkeletonElement
      width={width}
      height="auto"
      variant="rounded"
      className={getSizeClass()}
      delay={delay}
    />
  );
});

const SkeletonMetric = React.memo(({ hasIcon = true, delay = 0 }) => (
  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-neutral-200">
    {hasIcon && (
      <SkeletonAvatar size="sm" delay={delay} />
    )}
    <div className="flex-1">
      <SkeletonElement
        height="1.5rem"
        width="3rem"
        delay={delay + 50}
      />
      <SkeletonElement
        height="0.75rem"
        width="4rem"
        delay={delay + 100}
      />
    </div>
  </div>
));

// Loading patterns for specific components
const SkeletonPatterns = {
  // Weather card skeleton
  WeatherCard: React.memo(({ delay = 0 }) => (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse-slow"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-4">
        <SkeletonElement height="1.5rem" width="8rem" delay={delay} />
        <SkeletonAvatar size="sm" delay={delay + 50} />
      </div>
      <div className="text-center mb-6">
        <SkeletonElement height="4rem" width="6rem" className="mx-auto mb-2" delay={delay + 100} />
        <SkeletonElement height="1rem" width="4rem" className="mx-auto" delay={delay + 150} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SkeletonMetric hasIcon delay={delay + 200} />
        <SkeletonMetric hasIcon delay={delay + 250} />
      </div>
    </div>
  )),

  // System status skeleton
  StatusIndicator: React.memo(({ delay = 0 }) => (
    <div className="flex items-center space-x-2 px-3 py-2 bg-neutral-50 rounded-lg animate-pulse-slow"
      style={{ animationDelay: `${delay}ms` }}>
      <SkeletonElement
        width="1rem"
        height="1rem"
        variant="circular"
        delay={delay}
      />
      <SkeletonElement
        height="0.875rem"
        width="4rem"
        delay={delay + 50}
      />
    </div>
  )),

  // Temperature hero skeleton
  TemperatureHero: React.memo(({ delay = 0 }) => (
    <div className="relative rounded-2xl bg-gradient-to-br from-neutral-400 to-neutral-500 p-8 animate-pulse-slow overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />
      <div className="relative text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <SkeletonElement
            width="3rem"
            height="3rem"
            variant="circular"
            className="bg-white/20"
            delay={delay}
          />
          <div>
            <SkeletonElement
              height="1.5rem"
              width="8rem"
              className="bg-white/20 mb-1"
              delay={delay + 50}
            />
            <SkeletonElement
              height="1rem"
              width="6rem"
              className="bg-white/20"
              delay={delay + 100}
            />
          </div>
        </div>
        <SkeletonElement
          height="5rem"
          width="8rem"
          className="bg-white/20 mx-auto mb-4"
          delay={delay + 150}
        />
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
          <div className="bg-white/10 rounded-xl p-4">
            <SkeletonElement
              height="1rem"
              width="4rem"
              className="bg-white/20 mb-2"
              delay={delay + 200}
            />
            <SkeletonElement
              height="1.5rem"
              width="3rem"
              className="bg-white/20"
              delay={delay + 250}
            />
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <SkeletonElement
              height="1rem"
              width="4rem"
              className="bg-white/20 mb-2"
              delay={delay + 300}
            />
            <SkeletonElement
              height="1.5rem"
              width="3rem"
              className="bg-white/20"
              delay={delay + 350}
            />
          </div>
        </div>
      </div>
    </div>
  )),

  // Map skeleton
  MapView: React.memo(({ delay = 0 }) => (
    <div className="relative rounded-xl bg-neutral-200 aspect-[16/9] overflow-hidden animate-pulse-slow"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-200" />
      <div className="absolute top-4 left-4 right-4">
        <div className="flex justify-between items-center">
          <SkeletonElement
            height="2rem"
            width="8rem"
            className="bg-white shadow-md"
            delay={delay}
          />
          <SkeletonElement
            height="2rem"
            width="6rem"
            className="bg-white shadow-md"
            delay={delay + 50}
          />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <SkeletonElement
            width="4rem"
            height="4rem"
            variant="circular"
            className="mx-auto mb-4 bg-white/50"
            delay={delay + 100}
          />
          <SkeletonElement
            height="1rem"
            width="8rem"
            className="bg-white/50"
            delay={delay + 150}
          />
        </div>
      </div>
    </div>
  )),

  // Region stats skeleton
  RegionStats: React.memo(({ delay = 0 }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="bg-white rounded-lg p-4 border border-neutral-200 text-center animate-pulse-slow"
          style={{ animationDelay: `${delay + (index * 50)}ms` }}>
          <SkeletonElement
            height="2rem"
            width="3rem"
            className="mx-auto mb-2"
            delay={delay + (index * 50)}
          />
          <SkeletonElement
            height="0.875rem"
            width="4rem"
            className="mx-auto"
            delay={delay + (index * 50) + 50}
          />
        </div>
      ))}
    </div>
  )),
};

// Main SkeletonLoader component with pattern selection
const SkeletonLoader = ({
  pattern = 'card',
  count = 1,
  stagger = 100,
  className = '',
  ...props
}) => {
  const PatternComponent = SkeletonPatterns[pattern] || SkeletonCard;

  if (count === 1) {
    return <PatternComponent delay={0} {...props} />;
  }

  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <PatternComponent
          key={index}
          delay={index * stagger}
          {...props}
        />
      ))}
    </div>
  );
};

// Attach subcomponents and patterns
SkeletonLoader.Element = SkeletonElement;
SkeletonLoader.Text = SkeletonText;
SkeletonLoader.Card = SkeletonCard;
SkeletonLoader.Avatar = SkeletonAvatar;
SkeletonLoader.Button = SkeletonButton;
SkeletonLoader.Metric = SkeletonMetric;
SkeletonLoader.Patterns = SkeletonPatterns;

// Display names
SkeletonElement.displayName = 'SkeletonElement';
SkeletonText.displayName = 'SkeletonText';
SkeletonCard.displayName = 'SkeletonCard';
SkeletonAvatar.displayName = 'SkeletonAvatar';
SkeletonButton.displayName = 'SkeletonButton';
SkeletonMetric.displayName = 'SkeletonMetric';
SkeletonLoader.displayName = 'SkeletonLoader';

// PropTypes
SkeletonElement.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  variant: PropTypes.oneOf(['rectangular', 'circular', 'rounded', 'text']),
  delay: PropTypes.number,
};

SkeletonText.propTypes = {
  lines: PropTypes.number,
  spacing: PropTypes.oneOf(['tight', 'normal', 'loose']),
  delay: PropTypes.number,
};

SkeletonCard.propTypes = {
  hasImage: PropTypes.bool,
  hasTitle: PropTypes.bool,
  hasSubtitle: PropTypes.bool,
  hasActions: PropTypes.bool,
  delay: PropTypes.number,
};

SkeletonAvatar.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  delay: PropTypes.number,
};

SkeletonButton.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  delay: PropTypes.number,
};

SkeletonMetric.propTypes = {
  hasIcon: PropTypes.bool,
  delay: PropTypes.number,
};

SkeletonLoader.propTypes = {
  pattern: PropTypes.string,
  count: PropTypes.number,
  stagger: PropTypes.number,
  className: PropTypes.string,
};

export default SkeletonLoader;