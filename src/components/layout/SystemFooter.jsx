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
    <footer className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-t border-slate-200 mt-12 overflow-hidden" role="contentinfo">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]"></div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Enhanced footer content */}
        <div className="text-center">
          {/* 간소화된 푸터 - 제목과 부제목 제거 */}

          {/* 장식적 요소들 - 심플하게 유지 */}
          <div className="flex justify-center space-x-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>

      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
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