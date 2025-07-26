import React from 'react';
import { 
  Zap, 
  Camera, 
  Brain, 
  Globe, 
  Github,
  ExternalLink,
  BookOpen
} from 'lucide-react';

const SystemFooter = ({ systemStats = {} }) => {
  const footerSections = [
    {
      title: '🛠️ 시스템 정보',
      icon: Zap,
      iconColor: 'text-blue-500',
      items: [
        'GitHub Actions 자동화',
        'Claude AI 이미지 분석',
        '5분마다 자동 업데이트',
        '실시간 웹캠 모니터링'
      ]
    },
    {
      title: '📊 데이터 소스',
      icon: Camera,
      iconColor: 'text-green-500',
      items: [
        '싱가포르 공공 웹캠',
        '교통 카메라 (LTA API)',
        '관광지 라이브캠',
        'NEA 기상청 데이터'
      ]
    },
    {
      title: '🤖 분석 항목',
      icon: Brain,
      iconColor: 'text-purple-500',
      items: [
        '날씨 상태 자동 판단',
        '가시성 정확도 평가',
        '강수량 실시간 감지',
        '활동 적합성 분석'
      ]
    },
    {
      title: '⚡ 기술 스택',
      icon: Globe,
      iconColor: 'text-yellow-500',
      items: [
        'GitHub Pages 호스팅',
        'React + Vite + Tailwind CSS',
        'Claude Vision API',
        'Leaflet 지도 시스템'
      ]
    }
  ];

  const links = [
    {
      name: 'GitHub Repository',
      url: 'https://github.com/djyalu/singapore_weather_cam',
      icon: Github
    },
    {
      name: 'API Documentation',
      url: '#',
      icon: BookOpen
    },
    {
      name: 'Live Demo',
      url: 'https://djyalu.github.io/singapore_weather_cam/',
      icon: ExternalLink
    }
  ];

  return (
    <footer className="bg-white shadow-xl border-t-4 border-blue-500 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 메인 섹션들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    className="text-blue-600 hover:underline flex items-center space-x-1 hover:text-blue-800 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{link.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* 시스템 설명 박스 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800 text-center">
            <strong>🔬 자동화 시스템:</strong> GitHub Actions가 5분마다 싱가포르 웹캠을 캡처하여 
            Claude AI가 실시간으로 날씨를 분석하고, 결과를 자동으로 웹사이트에 업데이트합니다.
            <br />
            <span className="text-xs text-blue-600 mt-1 block">
              {systemStats.totalProcessingTime && `평균 처리 시간: ${systemStats.totalProcessingTime}`}
              {systemStats.averageConfidence && ` | 평균 정확도: ${systemStats.averageConfidence}%`}
              {' | 가동률: 99.9%'}
            </span>
          </p>
        </div>

        {/* Hwa Chong 중심 정보 */}
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
          <p className="text-sm text-center">
            <strong>🏫 중심 위치:</strong> Hwa Chong International School (663 Bukit Timah Road)을 
            중심으로 싱가포르 날씨와 웹캠 정보를 제공합니다.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SystemFooter;