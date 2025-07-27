import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Performance Optimizer Component
 * Implements advanced performance optimizations and memory management
 */
const PerformanceOptimizer = React.memo(() => {
  const performanceRef = useRef({
    intersectionObserver: null,
    memoryMonitor: null,
    isVisible: true,
  });

  // Memory management and garbage collection hints
  const optimizeMemory = useCallback(() => {
    // Force garbage collection if available (Chrome DevTools)
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }

    // Clear any unnecessary timers or intervals
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }

    // Suggest memory cleanup to browser
    if ('memory' in performance) {
      const memInfo = performance.memory;
      const usage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;
      
      if (usage > 0.85) {
        console.warn('🚨 High memory usage detected:', {
          used: Math.round(memInfo.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memInfo.totalJSHeapSize / 1048576) + ' MB',
          usage: Math.round(usage * 100) + '%'
        });
        
        // Clear image caches if memory is high
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              if (cacheName.includes('image') || cacheName.includes('webcam')) {
                caches.delete(cacheName);
              }
            });
          });
        }
      }
    }
  }, []);

  // Intersection Observer for visibility-based optimizations
  const setupIntersectionObserver = useCallback(() => {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target;
          
          if (entry.isIntersecting) {
            // Element is visible - enable full functionality
            element.classList.remove('performance-optimized');
            
            // Lazy load images
            const images = element.querySelectorAll('img[data-src]');
            images.forEach(img => {
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
            });
          } else {
            // Element is not visible - apply optimizations
            element.classList.add('performance-optimized');
            
            // Pause animations and videos
            const videos = element.querySelectorAll('video');
            videos.forEach(video => video.pause());
            
            const canvases = element.querySelectorAll('canvas');
            canvases.forEach(canvas => {
              const ctx = canvas.getContext('2d');
              if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
          }
        });
      },
      {
        threshold: [0, 0.1, 0.5, 1.0],
        rootMargin: '50px'
      }
    );

    // Observe all major sections
    const sections = document.querySelectorAll('section[id], .webcam-card, .analysis-card');
    sections.forEach(section => observer.observe(section));

    performanceRef.current.intersectionObserver = observer;
  }, []);

  // Image optimization
  const optimizeImages = useCallback(() => {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach(img => {
      // Add loading="lazy" to images
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Add performance-optimized decoding
      img.setAttribute('decoding', 'async');
      
      // Mark as optimized
      img.setAttribute('data-optimized', 'true');
      
      // Error handling for broken images
      img.onerror = () => {
        img.style.display = 'none';
        console.warn('Image failed to load:', img.src);
      };
    });
  }, []);

  // CPU usage monitoring and throttling
  const monitorPerformance = useCallback(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        
        if (fps < 30) {
          // Low FPS detected - apply throttling
          console.warn('🐌 Low FPS detected:', fps);
          
          // Reduce animation frequency
          document.documentElement.style.setProperty('--animation-duration', '2s');
          
          // Disable some visual effects
          document.body.classList.add('performance-mode');
        } else if (fps > 50) {
          // Good performance - restore normal settings
          document.documentElement.style.removeProperty('--animation-duration');
          document.body.classList.remove('performance-mode');
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }, []);

  // Setup performance monitoring
  useEffect(() => {
    // Initial optimizations
    optimizeImages();
    setupIntersectionObserver();
    monitorPerformance();

    // Memory optimization interval
    const memoryInterval = setInterval(optimizeMemory, 30000); // Every 30 seconds

    // Image optimization for dynamically loaded content
    const imageObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const images = node.querySelectorAll?.('img:not([data-optimized])') || [];
              if (node.tagName === 'IMG' && !node.hasAttribute('data-optimized')) {
                images.push(node);
              }
              
              images.forEach(img => {
                img.setAttribute('loading', 'lazy');
                img.setAttribute('decoding', 'async');
                img.setAttribute('data-optimized', 'true');
              });
            }
          });
        }
      });
    });

    imageObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Page visibility API for aggressive optimization
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - aggressive optimization
        performanceRef.current.isVisible = false;
        
        // Pause all videos
        document.querySelectorAll('video').forEach(video => video.pause());
        
        // Stop all animations
        document.body.classList.add('page-hidden');
        
        // Clear unnecessary intervals
        optimizeMemory();
      } else {
        // Page is visible - restore functionality
        performanceRef.current.isVisible = true;
        document.body.classList.remove('page-hidden');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(memoryInterval);
      
      if (performanceRef.current.intersectionObserver) {
        performanceRef.current.intersectionObserver.disconnect();
      }
      
      imageObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [optimizeImages, setupIntersectionObserver, monitorPerformance, optimizeMemory]);

  return null; // This component only provides optimization effects
});

PerformanceOptimizer.displayName = 'PerformanceOptimizer';

export default PerformanceOptimizer;