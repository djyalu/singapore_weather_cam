import { useMemo } from 'react';

/**
 * Custom hook for calculating system statistics from webcam data
 * Extracted from App.jsx to improve component clarity and reusability
 */
export const useSystemStats = (webcamData) => {
  return useMemo(() => {
    if (!webcamData?.captures) {
      return {};
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

    // Format timestamp with proper localization
    const formatTimestamp = (timestamp) => {
      if (!timestamp) {return null;}
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

    return {
      totalWebcams,
      successfulAnalyses,
      failedAnalyses,
      averageConfidence,
      lastUpdate: formatTimestamp(webcamData.timestamp),
      totalProcessingTime: '15-30s',
      dominantWeather,
      successRate: totalWebcams > 0 ? Math.round((successfulAnalyses / totalWebcams) * 100) : 0,
    };
  }, [webcamData]);
};

export default useSystemStats;