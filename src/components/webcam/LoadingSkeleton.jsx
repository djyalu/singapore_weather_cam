import React from 'react';

/**
 * LoadingSkeleton Component
 * 
 * Provides modern skeleton UI patterns for the TrafficCameraGallery component
 * Features:
 * - Camera card skeletons matching actual layout
 * - Progressive loading animations with staggered timing
 * - Shimmer effects using CSS animations
 * - Mobile responsive design
 * - Accessibility compliant
 */

const CameraCardSkeleton = React.memo(({ delay = 0 }) => (
  <div 
    className="card animate-pulse"
    style={{ 
      animationDelay: `${delay}ms`,
      animationDuration: '1.5s'
    }}
    role="status"
    aria-label="Loading camera"
  >
    {/* Image placeholder with shimmer effect */}
    <div className="aspect-video bg-gray-200 rounded overflow-hidden mb-3 relative">
      <div className="skeleton w-full h-full"></div>
      {/* Optional loading indicator overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>

    {/* Camera name skeleton */}
    <div className="skeleton h-4 w-3/4 mb-2 rounded"></div>
    
    {/* Area name skeleton */}
    <div className="skeleton h-3 w-1/2 mb-3 rounded"></div>

    {/* Bottom metadata row */}
    <div className="flex items-center justify-between">
      <div className="skeleton h-3 w-16 rounded"></div>
      <div className="skeleton h-3 w-20 rounded"></div>
    </div>

    {/* Screen reader content */}
    <span className="sr-only">Loading camera information</span>
  </div>
));

const ControlsSkeleton = React.memo(() => (
  <div className="card animate-pulse" role="status" aria-label="Loading controls">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Control buttons skeleton */}
      <div className="flex items-center gap-4">
        <div className="skeleton h-8 w-20 rounded"></div>
        <div className="skeleton h-8 w-16 rounded"></div>
        <div className="skeleton h-8 w-14 rounded"></div>
      </div>

      {/* Right side controls skeleton */}
      <div className="flex items-center gap-4">
        <div className="skeleton h-6 w-24 rounded"></div>
        <div className="skeleton h-8 w-20 rounded"></div>
      </div>
    </div>

    {/* Last update skeleton */}
    <div className="mt-3">
      <div className="skeleton h-3 w-48 rounded"></div>
    </div>

    <span className="sr-only">Loading gallery controls</span>
  </div>
));

const SummarySkeleton = React.memo(() => (
  <div className="card animate-pulse" role="status" aria-label="Loading summary">
    <div className="flex items-center justify-between">
      <div className="skeleton h-4 w-40 rounded"></div>
      <div className="skeleton h-4 w-32 rounded"></div>
    </div>
    <span className="sr-only">Loading camera summary</span>
  </div>
));

/**
 * Main LoadingSkeleton Component
 * 
 * @param {Object} props
 * @param {number} props.count - Number of camera cards to show (default: 8)
 * @param {boolean} props.showControls - Whether to show controls skeleton (default: true)
 * @param {boolean} props.showSummary - Whether to show summary skeleton (default: true)
 * @param {string} props.variant - Skeleton variant ('default' | 'compact' | 'minimal')
 */
const LoadingSkeleton = ({
  count = 8,
  showControls = true,
  showSummary = true,
  variant = 'default'
}) => {
  // Calculate responsive grid based on viewport
  const getGridCols = () => {
    if (variant === 'compact') return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
    if (variant === 'minimal') return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  // Stagger animation delays for natural loading feel
  const getStaggerDelay = (index) => {
    const baseDelay = Math.floor(index / 4) * 100; // Group delays
    const itemDelay = (index % 4) * 50; // Individual delays within group
    return baseDelay + itemDelay;
  };

  return (
    <div className="space-y-6" role="region" aria-label="Loading camera gallery">
      {/* Controls skeleton */}
      {showControls && <ControlsSkeleton />}

      {/* Camera grid skeleton */}
      <div className={`grid ${getGridCols()} gap-4`}>
        {Array.from({ length: count }, (_, index) => (
          <CameraCardSkeleton 
            key={`skeleton-${index}`}
            delay={getStaggerDelay(index)}
          />
        ))}
      </div>

      {/* Summary skeleton */}
      {showSummary && <SummarySkeleton />}

      {/* Loading announcement for screen readers */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        Loading camera gallery with {count} items. Please wait...
      </div>
    </div>
  );
};

// Individual component exports for granular usage
LoadingSkeleton.CameraCard = CameraCardSkeleton;
LoadingSkeleton.Controls = ControlsSkeleton;
LoadingSkeleton.Summary = SummarySkeleton;

// Display names for better debugging
CameraCardSkeleton.displayName = 'CameraCardSkeleton';
ControlsSkeleton.displayName = 'ControlsSkeleton';
SummarySkeleton.displayName = 'SummarySkeleton';
LoadingSkeleton.displayName = 'LoadingSkeleton';

export default LoadingSkeleton;