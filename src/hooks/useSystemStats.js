import { useMemo } from 'react';

/**
 * Custom hook for calculating system statistics from webcam and traffic camera data
 * Updated to prioritize traffic cameras which are actively used in the application
 */
export const useSystemStats = (webcamData, trafficCameraData) => {
  // Format timestamp with proper localization (used by both systems)
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    try {
      return new Date(timestamp).toLocaleString('en-SG', {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.warn('Invalid timestamp format:', timestamp);
      return null;
    }
  };

  return useMemo(() => {
    // Priority 1: Use traffic camera data (actively used)
    if (trafficCameraData?.cameras) {
      const totalCameras = trafficCameraData.totalCameras || trafficCameraData.cameras.length;
      
      return {
        totalWebcams: totalCameras, // Keep property name for backward compatibility
        totalCameras: totalCameras,
        lastUpdate: formatTimestamp(trafficCameraData.timestamp),
        totalProcessingTime: '1-2s', // Traffic cameras load faster
        dataSource: 'Singapore Traffic Cameras (data.gov.sg)',
        successRate: 100, // Traffic cameras are always available
      };
    }

    // Priority 2: Fall back to webcam data (legacy)
    if (!webcamData?.captures) {
      // No data available - show loading state
      return {
        totalWebcams: 0,
        totalCameras: 0,
        lastUpdate: null,
        dataSource: 'Loading...',
        successRate: 0,
      };
    }

    const totalWebcams = webcamData.total_cameras || webcamData.captures.length;
    const successfulAnalyses = webcamData.successful_captures ||
      webcamData.captures.filter(c => c.status === 'success').length;
    const failedAnalyses = webcamData.failed_captures ||
      webcamData.captures.filter(c => c.status === 'failed').length;

    // Calculate average confidence from actual analysis data
    const analysisConfidences = webcamData.captures
      .filter(c => c.analysis?.confidence && c.status === 'success')
      .map(c => c.analysis.confidence);

    const averageConfidence = analysisConfidences.length > 0
      ? Math.floor(analysisConfidences.reduce((a, b) => a + b, 0) / analysisConfidences.length)
      : 0;

    // Determine dominant weather condition with improved logic
    const weatherConditions = webcamData.captures
      .filter(c => c.ai_analysis?.weather_condition)
      .map(c => {
        const condition = c.ai_analysis.weather_condition.toLowerCase();
        if (condition.includes('sunny') || condition.includes('clear')) {
          return 'sunny';
        }
        if (condition.includes('cloudy') || condition.includes('overcast')) {
          return 'cloudy';
        }
        if (condition.includes('partly')) {
          return 'partly_cloudy';
        }
        if (condition.includes('rain')) {
          return 'light_rain';
        }
        return 'sunny';
      });

    const dominantWeather = weatherConditions.length > 0
      ? weatherConditions.reduce((a, b, i, arr) =>
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b,
      )
      : 'sunny';


    return {
      totalWebcams,
      totalCameras: totalWebcams,
      successfulAnalyses,
      failedAnalyses,
      averageConfidence,
      lastUpdate: formatTimestamp(webcamData.timestamp),
      totalProcessingTime: '15-30s',
      dominantWeather,
      dataSource: 'Legacy Webcam System',
      successRate: totalWebcams > 0 ? Math.round((successfulAnalyses / totalWebcams) * 100) : 0,
    };
  }, [webcamData, trafficCameraData]);
};

export default useSystemStats;