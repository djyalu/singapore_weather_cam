import { useEffect, useState } from 'react';

/**
 * Custom hook for service worker management
 * Handles PWA registration, updates, and offline capabilities
 */
export const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      registerServiceWorker();
    }
  }, []);

  // Listen for online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger background sync when coming back online
      if (registration?.sync) {
        registration.sync.register('weather-data-sync');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [registration]);

  // Listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      setRegistration(reg);

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              setIsUpdateAvailable(true);
            }
          }
        });
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          // Data has been updated in the background
          console.log('Cache updated:', event.data.payload);
        }
      });

      console.log('Service worker registered successfully');
    } catch (error) {
      console.log('Service worker registration failed:', error);
    }
  };

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
      // Refresh page to load new version
      window.location.reload();
    }
  };

  const installPWA = async () => {
    if (installPrompt) {
      // Show the install prompt
      installPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA install accepted');
      } else {
        console.log('PWA install dismissed');
      }
      
      // Clear the prompt
      setInstallPrompt(null);
    }
  };

  const requestPersistentStorage = async () => {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log('Persistent storage:', persistent);
        return persistent;
      } catch (error) {
        console.log('Persistent storage request failed:', error);
        return false;
      }
    }
    return false;
  };

  const getStorageEstimate = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          usagePercentage: Math.round((estimate.usage / estimate.quota) * 100)
        };
      } catch (error) {
        console.log('Storage estimate failed:', error);
        return null;
      }
    }
    return null;
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.log('Notification permission request failed:', error);
        return false;
      }
    }
    return false;
  };

  return {
    isOnline,
    isUpdateAvailable,
    canInstall: !!installPrompt,
    installPWA,
    updateServiceWorker,
    requestPersistentStorage,
    getStorageEstimate,
    requestNotificationPermission,
    registration
  };
};

export default useServiceWorker;