import { useState, useEffect } from 'react';

export const useWebcamData = () => {
  const [webcamData, setWebcamData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWebcamData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to fetch from data files
      try {
        const response = await fetch('/data/webcam/latest.json');
        if (response.ok) {
          const data = await response.json();
          setWebcamData(data);
          return;
        }
      } catch (err) {
        console.log('Local webcam data not available, using mock data');
      }

      // Fallback to mock data
      const mockData = {
        cameras: [
          {
            id: '1001',
            name: 'Bukit Timah Road',
            image: '/images/webcam/placeholder.jpg',
            location: 'Bukit Timah',
            lat: 1.3520,
            lng: 103.7767,
            status: 'active',
            lastUpdate: new Date().toISOString(),
          },
          {
            id: '1002',
            name: 'Newton Circus',
            image: '/images/webcam/placeholder.jpg',
            location: 'Newton',
            lat: 1.3138,
            lng: 103.8420,
            status: 'active',
            lastUpdate: new Date().toISOString(),
          },
        ],
        lastUpdate: new Date().toISOString(),
      };

      setWebcamData(mockData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebcamData();
  }, []);

  return {
    webcamData,
    isLoading,
    error,
    refetch: fetchWebcamData,
  };
};