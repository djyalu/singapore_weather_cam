import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Zap,
  Camera,
  Brain,
  Globe,
  Github,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

const SystemFooter = React.memo(({ systemStats = {} }) => {
  return (
    <footer className="bg-white shadow-xl border-t-4 border-blue-500 mt-12" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 간단한 푸터 */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Singapore Weather Cam
          </p>
        </div>
      </div>
    </footer>
  );
});

SystemFooter.propTypes = {
  systemStats: PropTypes.shape({
    lastUpdate: PropTypes.string,
    totalProcessingTime: PropTypes.string,
    averageConfidence: PropTypes.number,
  }),
};

SystemFooter.displayName = 'SystemFooter';

export default SystemFooter;