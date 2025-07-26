import React from 'react';
import PropTypes from 'prop-types';
import { Brain } from 'lucide-react';

/**
 * AI Analysis section component
 * Displays Claude AI analysis results for weather and environmental conditions
 */
const AIAnalysisSection = React.memo(({ location }) => {
  if (!location.ai_analysis) {
    return null;
  }

  const analysisItems = [
    { key: 'weather_condition', label: 'Weather', value: location.ai_analysis.weather_condition },
    { key: 'nature_condition', label: 'Nature State', value: location.ai_analysis.nature_condition },
    { key: 'traffic_level', label: 'Traffic', value: location.ai_analysis.traffic_level },
    { key: 'urban_activity', label: 'Urban Activity', value: location.ai_analysis.urban_activity },
    { key: 'residential_area', label: 'Residential', value: location.ai_analysis.residential_area },
    { key: 'visibility', label: 'Visibility', value: location.ai_analysis.visibility },
    { key: 'air_quality', label: 'Air Quality', value: location.ai_analysis.air_quality },
  ].filter(item => item.value); // Only show items with values

  if (analysisItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-white bg-opacity-90 rounded-xl p-4 backdrop-blur-sm border-l-4 border-blue-500">
      <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
        <Brain className="w-4 h-4 mr-2 text-blue-500" aria-hidden="true" />
        🤖 AI Analysis
      </h4>
      
      <div className="space-y-2 text-xs text-gray-700">
        {analysisItems.map((item) => (
          <div key={item.key} className="flex">
            <span className="font-medium min-w-[80px]">{item.label}:</span>
            <span className="flex-1">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Enhanced analysis if available */}
      {location.analysis?.observations && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Observations:</span>
            <p className="mt-1 leading-relaxed">{location.analysis.observations}</p>
          </div>
        </div>
      )}
    </div>
  );
});

AIAnalysisSection.propTypes = {
  location: PropTypes.shape({
    ai_analysis: PropTypes.shape({
      weather_condition: PropTypes.string,
      nature_condition: PropTypes.string,
      traffic_level: PropTypes.string,
      urban_activity: PropTypes.string,
      residential_area: PropTypes.string,
      visibility: PropTypes.string,
      air_quality: PropTypes.string,
    }),
    analysis: PropTypes.shape({
      observations: PropTypes.string,
    }),
  }).isRequired,
};

AIAnalysisSection.displayName = 'AIAnalysisSection';

export default AIAnalysisSection;