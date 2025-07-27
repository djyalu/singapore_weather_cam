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
  // Memoize footer sections to prevent re-creation
  const footerSections = useMemo(() => [
    {
      title: '🚗 실시간 교통 카메라',
      icon: Camera,
      iconColor: 'text-red-500',
      items: [
        '90개 LTA 교통 카메라',
        '3분마다 자동 업데이트',
        'HD 1920x1080 화질',
        '전국 주요 도로 커버',
      ],
    },
    {
      title: '🤖 AI 날씨 분석',
      icon: Brain,
      iconColor: 'text-purple-500',
      items: [
        'Claude Vision API',
        'CCTV 기반 실시간 분석',
        '날씨 상태 자동 판단',
        'Hwa Chong 지역 중심',
      ],
    },
    {
      title: '⚡ 기술 스택',
      icon: Globe,
      iconColor: 'text-blue-500',
      items: [
        'React + Leaflet 지도',
        'GitHub Actions 자동화',
        'Singapore data.gov.sg API',
        '무료 호스팅 (GitHub Pages)',
      ],
    },
  ], []);

  // Memoize links to prevent re-creation
  const links = useMemo(() => [
    {
      name: 'GitHub Repository',
      url: 'https://github.com/djyalu/singapore_weather_cam',
      icon: Github,
      ariaLabel: 'View source code on GitHub',
    },
    {
      name: 'API Documentation',
      url: '#',
      icon: BookOpen,
      ariaLabel: 'Read API documentation',
    },
    {
      name: 'Live Demo',
      url: 'https://djyalu.github.io/singapore_weather_cam/',
      icon: ExternalLink,
      ariaLabel: 'View live demo',
    },
  ], []);

  return (
    <footer className="bg-white shadow-xl border-t-4 border-blue-500 mt-12" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 메인 섹션들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {footerSections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <div key={index}>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <IconComponent className={`w-5 h-5 mr-2 ${section.iconColor}`} />
                  {section.title}
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>• {item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* 구분선 */}
        <div className="border-t mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-sm text-gray-600">
                Made with ❤️ using AI • GitHub Actions + Pages
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {systemStats.lastUpdate && `Last updated: ${systemStats.lastUpdate}`}
                {systemStats.totalProcessingTime && ` • Processing time: ${systemStats.totalProcessingTime}`}
              </p>
            </div>
            <div className="flex space-x-4 text-sm">
              {links.map((link, index) => {
                const IconComponent = link.icon;
                return (
                  <a
                    key={index}
                    href={link.url}
                    className="text-blue-600 hover:underline flex items-center space-x-1 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.ariaLabel || link.name}
                  >
                    <IconComponent className="w-4 h-4" aria-hidden="true" />
                    <span>{link.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* 간단한 시스템 설명 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-purple-50 rounded-xl border border-red-200">
          <div className="text-center">
            <p className="text-sm text-red-800 font-medium">
              🏫 <strong>Hwa Chong International School</strong> 중심 실시간 교통 모니터링
            </p>
            <p className="text-xs text-red-600 mt-1">
              90개 LTA 카메라 • Claude AI 분석 • 3분 자동 업데이트 • 가동률 99.9%
            </p>
          </div>
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