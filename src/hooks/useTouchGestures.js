import { useRef, useCallback, useEffect } from 'react';

/**
 * Advanced Touch Gestures Hook
 * Provides comprehensive touch gesture support for mobile-first UX
 */
export const useTouchGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onLongPress,
    onDoubleTap,
    threshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    enablePinch = false,
    enableRotation = false,
  } = options;

  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const lastTapRef = useRef(0);
  const touchCountRef = useRef(0);
  const initialDistanceRef = useRef(0);
  const initialAngleRef = useRef(0);

  // Calculate distance between two points
  const getDistance = useCallback((touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate angle between two points
  const getAngle = useCallback((touch1, touch2) => {
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * 180 / Math.PI;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    touchCountRef.current = e.touches.length;

    // Multi-touch for pinch/rotation
    if (e.touches.length === 2 && (enablePinch || enableRotation)) {
      initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
      initialAngleRef.current = getAngle(e.touches[0], e.touches[1]);
    }

    // Long press detection
    if (onLongPress && e.touches.length === 1) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress({
          x: touch.clientX,
          y: touch.clientY,
          target: e.target,
        });
      }, longPressDelay);
    }

    // Double tap detection
    if (onDoubleTap && e.touches.length === 1) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      
      if (timeSinceLastTap < doubleTapDelay && timeSinceLastTap > 0) {
        onDoubleTap({
          x: touch.clientX,
          y: touch.clientY,
          target: e.target,
        });
      }
      lastTapRef.current = now;
    }
  }, [onLongPress, onDoubleTap, longPressDelay, doubleTapDelay, enablePinch, enableRotation, getDistance, getAngle]);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    // Clear long press if finger moves
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle pinch/rotation
    if (e.touches.length === 2 && (enablePinch || enableRotation)) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const currentAngle = getAngle(e.touches[0], e.touches[1]);

      if (enablePinch && onPinch && initialDistanceRef.current > 0) {
        const scale = currentDistance / initialDistanceRef.current;
        onPinch({
          scale,
          center: {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
          },
        });
      }

      if (enableRotation && currentAngle !== undefined && initialAngleRef.current !== undefined) {
        const rotation = currentAngle - initialAngleRef.current;
        // Could trigger rotation callback here if needed
      }
    }
  }, [enablePinch, enableRotation, onPinch, getDistance, getAngle]);

  // Handle touch end
  const handleTouchEnd = useCallback((e) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current || touchCountRef.current > 1) return;

    const touch = e.changedTouches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time;

    // Only process swipes if they're fast enough and long enough
    if (deltaTime < 1000 && (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold)) {
      // Determine primary direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > threshold && onSwipeRight) {
          onSwipeRight({
            startX: touchStartRef.current.x,
            startY: touchStartRef.current.y,
            endX: touchEndRef.current.x,
            endY: touchEndRef.current.y,
            deltaX,
            deltaY,
            deltaTime,
            target: e.target,
          });
        } else if (deltaX < -threshold && onSwipeLeft) {
          onSwipeLeft({
            startX: touchStartRef.current.x,
            startY: touchStartRef.current.y,
            endX: touchEndRef.current.x,
            endY: touchEndRef.current.y,
            deltaX,
            deltaY,
            deltaTime,
            target: e.target,
          });
        }
      } else {
        // Vertical swipe
        if (deltaY > threshold && onSwipeDown) {
          onSwipeDown({
            startX: touchStartRef.current.x,
            startY: touchStartRef.current.y,
            endX: touchEndRef.current.x,
            endY: touchEndRef.current.y,
            deltaX,
            deltaY,
            deltaTime,
            target: e.target,
          });
        } else if (deltaY < -threshold && onSwipeUp) {
          onSwipeUp({
            startX: touchStartRef.current.x,
            startY: touchStartRef.current.y,
            endX: touchEndRef.current.x,
            endY: touchEndRef.current.y,
            deltaX,
            deltaY,
            deltaTime,
            target: e.target,
          });
        }
      }
    }

    // Reset
    touchStartRef.current = null;
    touchEndRef.current = null;
    touchCountRef.current = 0;
    initialDistanceRef.current = 0;
    initialAngleRef.current = 0;
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  // Return touch event handlers
  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * Simplified Swipe Hook for common use cases
 */
export const useSwipeGestures = (callbacks) => {
  return useTouchGestures({
    onSwipeLeft: callbacks.onSwipeLeft,
    onSwipeRight: callbacks.onSwipeRight,
    onSwipeUp: callbacks.onSwipeUp,
    onSwipeDown: callbacks.onSwipeDown,
    threshold: 50,
  });
};

/**
 * Pull to Refresh Hook
 */
export const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 80,
    resistance = 2.5,
    enabled = true,
  } = options;

  const pullStartRef = useRef(null);
  const pullDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (!enabled || window.scrollY > 0) return;
    
    const touch = e.touches[0];
    pullStartRef.current = {
      y: touch.clientY,
      time: Date.now(),
    };
  }, [enabled]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || !pullStartRef.current || window.scrollY > 0) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - pullStartRef.current.y;

    if (deltaY > 0) {
      e.preventDefault();
      isPullingRef.current = true;
      pullDistanceRef.current = Math.min(deltaY / resistance, threshold * 1.5);

      // Update visual feedback
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${pullDistanceRef.current}px)`;
        containerRef.current.style.transition = 'none';
      }

      // Add visual feedback class
      if (pullDistanceRef.current >= threshold) {
        document.body.classList.add('pull-to-refresh-ready');
      } else {
        document.body.classList.remove('pull-to-refresh-ready');
      }
    }
  }, [enabled, threshold, resistance]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !isPullingRef.current) return;

    const shouldRefresh = pullDistanceRef.current >= threshold;

    // Reset visual state
    if (containerRef.current) {
      containerRef.current.style.transform = '';
      containerRef.current.style.transition = 'transform 0.3s ease';
    }
    
    document.body.classList.remove('pull-to-refresh-ready');

    // Trigger refresh if threshold met
    if (shouldRefresh && onRefresh) {
      onRefresh();
    }

    // Reset state
    pullStartRef.current = null;
    pullDistanceRef.current = 0;
    isPullingRef.current = false;
  }, [enabled, threshold, onRefresh]);

  return {
    pullToRefreshProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    setContainerRef: (ref) => {
      containerRef.current = ref;
    },
  };
};

export default useTouchGestures;