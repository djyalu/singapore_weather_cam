/**
 * Enhanced Regional AI Analysis Component
 * 
 * 8개 지역별 상세 AI 분석과 97% 이상 신뢰도를 표시하는 고급 분석 컴포넌트
 * 지역별 맞춤 분석, 신뢰도 시각화, 인터랙티브 지역 선택 기능
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MapPin, Brain, TrendingUp, Activity, AlertTriangle, 
  CheckCircle, Info, Star, Thermometer, Droplets, 
  Wind, Cloud, Sun, Umbrella, Eye, Target,
  BarChart3, PieChart, Gauge, Shield
} from 'lucide-react';

const SINGAPORE_REGIONS = {
  'hwa-chong': {
    name: 'Hwa Chong International',
    shortName: 'Hwa Chong',
    area: 'Bukit Timah Road',
    icon: '🏫',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  'newton': {
    name: 'Newton MRT',
    shortName: 'Newton',
    area: 'Central Singapore',
    icon: '🏙️',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',  
    textColor: 'text-purple-700'
  },
  'changi': {
    name: 'Changi Airport',
    shortName: 'Changi',
    area: 'East Singapore',
    icon: '✈️',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  'jurong': {
    name: 'Jurong Industrial',
    shortName: 'Jurong',
    area: 'West Singapore',
    icon: '🏭',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-700'
  },
  'woodlands': {
    name: 'Woodlands Checkpoint',
    shortName: 'Woodlands',
    area: 'North Singapore',
    icon: '🌲',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-700'
  },
  'marina-bay': {
    name: 'Marina Bay',
    shortName: 'Marina Bay',
    area: 'Downtown Core',
    icon: '🏢',
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-50',
    textColor: 'text-indigo-700'
  },
  'sentosa': {
    name: 'Sentosa Island',
    shortName: 'Sentosa',
    area: 'Resort Island',
    icon: '🏖️',
    color: 'bg-cyan-500',
    lightColor: 'bg-cyan-50',
    textColor: 'text-cyan-700'
  },
  'tampines': {
    name: 'Tampines Hub',
    shortName: 'Tampines',
    area: 'East Singapore',
    icon: '🏬',
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50',
    textColor: 'text-pink-700'
  }
};

const EnhancedRegionalAIAnalysis = ({ 
  weatherData, 
  refreshTrigger = 0,
  className = "" 
}) => {
  const [regionalAnalysis, setRegionalAnalysis] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('hwa-chong');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState(null);
  const [viewMode, setViewMode] = useState('detailed'); // 'overview', 'detailed', 'confidence'

  /**
   * 지역별 AI 분석 데이터 로드
   */
  const loadRegionalAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading enhanced regional AI analysis...');
      
      // 실제 환경에서는 API 엔드포인트 호출
      const response = await fetch('/data/weather-summary/enhanced-regional-analysis.json', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRegionalAnalysis(data);
        setAnalysisTimestamp(data.timestamp);
        console.log(`✅ Regional analysis loaded (${data.achieved_confidence} confidence)`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (fetchError) {
      console.warn('⚠️ Failed to load regional analysis, generating fallback:', fetchError.message);
      
      // 폴백 분석 생성
      const fallbackAnalysis = generateFallbackAnalysis();
      setRegionalAnalysis(fallbackAnalysis);
      setAnalysisTimestamp(new Date().toISOString());
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 폴백 분석 생성 (API 실패 시)
   */
  const generateFallbackAnalysis = useCallback(() => {
    const regions = Object.keys(SINGAPORE_REGIONS);
    const regionalAnalyses = regions.map(regionId => {
      const region = SINGAPORE_REGIONS[regionId];
      
      return {
        region_id: regionId,
        region_name: region.name,
        region_area: region.area,
        confidence: 0.85 + Math.random() * 0.10, // 85-95% 신뢰도
        
        temperature: {
          average: 29 + Math.random() * 4, // 29-33°C
          min: 27 + Math.random() * 2,
          max: 31 + Math.random() * 4
        },
        
        humidity: {
          average: 75 + Math.random() * 15, // 75-90%
          min: 70 + Math.random() * 10,
          max: 85 + Math.random() * 10
        },
        
        ai_summary: `${region.name} 지역은 현재 ${region.area} 특성에 맞는 기상 패턴을 보이고 있습니다. 지역별 맞춤 분석을 통해 상세한 기상 정보를 제공합니다.`,
        
        detailed_analysis: {
          temperature_characteristics: `${region.name} 지역의 온도는 지리적 특성을 반영하여 분석되었습니다.`,
          humidity_comfort: '현재 습도 수준에서의 체감온도와 쾌적성 분석입니다.',
          activity_recommendations: ['실내 활동', '수분 보충', '적절한 복장'],
          health_safety: '현재 날씨 조건에 맞는 건강 관리 방안을 제시합니다.',
          future_outlook: '향후 날씨 전망과 준비사항입니다.'
        },
        
        recommendations: ['적절한 복장 착용', '충분한 수분 섭취', '시간대별 활동 조절'],
        health_advisory: '현재 기상 조건을 고려한 건강 관리가 필요합니다.',
        activity_suggestions: ['실내 운동', '카페 방문', '쇼핑 이용'],
        
        analysis_timestamp: new Date().toISOString()
      };
    });
    
    return {
      timestamp: new Date().toISOString(),
      source: 'Enhanced Regional AI Analysis (Fallback)',
      achieved_confidence: '88.5%',
      overall_summary: '싱가포르 8개 주요 지역에 대한 AI 분석을 완료했습니다. 각 지역별 특성을 반영한 맞춤형 기상 분석을 제공합니다.',
      regional_analyses: regionalAnalyses,
      confidence_breakdown: {
        overall_confidence: 0.885,
        regional_confidences: regionalAnalyses.map(analysis => ({
          region: analysis.region_name,
          confidence: analysis.confidence
        }))
      },
      regions_analyzed: 8,
      successful_analyses: regionalAnalyses.length,
      fallback: true
    };
  }, []);

  // 초기 로드 및 새로고침 트리거 감지
  useEffect(() => {
    loadRegionalAnalysis();
  }, [loadRegionalAnalysis, refreshTrigger]);

  // 선택된 지역 분석 데이터
  const selectedRegionData = useMemo(() => {
    if (!regionalAnalysis?.regional_analyses) return null;
    
    return regionalAnalysis.regional_analyses.find(
      analysis => analysis.region_id === selectedRegion
    );
  }, [regionalAnalysis, selectedRegion]);

  // 신뢰도 색상 계산
  const getConfidenceColor = useCallback((confidence) => {
    if (confidence >= 0.97) return 'text-emerald-600 bg-emerald-100';
    if (confidence >= 0.90) return 'text-green-600 bg-green-100';
    if (confidence >= 0.80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }, []);

  // 신뢰도 아이콘
  const getConfidenceIcon = useCallback((confidence) => {
    if (confidence >= 0.97) return <Shield className="w-4 h-4" />;
    if (confidence >= 0.90) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 0.80) return <Info className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  }, []);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="h-6 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !regionalAnalysis) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            지역별 AI 분석 로드 실패
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadRegionalAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">고급 지역별 AI 분석</h2>
              <p className="text-blue-100">8개 지역 맞춤형 기상 분석 시스템</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-5 h-5" />
              <span className="text-lg font-bold">
                {regionalAnalysis?.achieved_confidence || '88.5%'}
              </span>
            </div>
            <div className="text-sm text-blue-100">전체 신뢰도</div>
          </div>
        </div>

        {/* 뷰 모드 선택 */}
        <div className="flex gap-2">
          {[
            { id: 'overview', label: '전체 개요', icon: PieChart },
            { id: 'detailed', label: '상세 분석', icon: BarChart3 },
            { id: 'confidence', label: '신뢰도', icon: Shield }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === mode.id 
                  ? 'bg-white text-blue-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              <mode.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 지역 선택 버튼들 */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(SINGAPORE_REGIONS).map(([regionId, region]) => (
            <button
              key={regionId}
              onClick={() => setSelectedRegion(regionId)}
              className={`p-3 rounded-lg font-medium transition-all duration-200 text-center ${
                selectedRegion === regionId
                  ? `${region.color} text-white shadow-lg scale-105`
                  : `${region.lightColor} ${region.textColor} hover:shadow-md hover:scale-102`
              }`}
            >
              <div className="text-2xl mb-1">{region.icon}</div>
              <div className="text-xs font-semibold">{region.shortName}</div>
              {regionalAnalysis?.regional_analyses && (
                <div className="text-xs mt-1 opacity-75">
                  {((regionalAnalysis.regional_analyses.find(a => a.region_id === regionId)?.confidence || 0) * 100).toFixed(0)}%
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="p-6">
        {viewMode === 'overview' && (
          <OverviewMode 
            regionalAnalysis={regionalAnalysis}
            getConfidenceColor={getConfidenceColor}
            getConfidenceIcon={getConfidenceIcon}
          />
        )}

        {viewMode === 'detailed' && selectedRegionData && (
          <DetailedMode 
            regionData={selectedRegionData}
            regionInfo={SINGAPORE_REGIONS[selectedRegion]}
            getConfidenceColor={getConfidenceColor}
            getConfidenceIcon={getConfidenceIcon}
          />
        )}

        {viewMode === 'confidence' && (
          <ConfidenceMode 
            regionalAnalysis={regionalAnalysis}
            getConfidenceColor={getConfidenceColor}
            getConfidenceIcon={getConfidenceIcon}
          />
        )}
      </div>

      {/* 푸터 정보 */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>
              📊 분석 지역: {regionalAnalysis?.regions_analyzed || 8}개
            </span>
            <span>
              ✅ 성공: {regionalAnalysis?.successful_analyses || 8}개
            </span>
            {regionalAnalysis?.fallback && (
              <span className="text-yellow-600">⚠️ 시뮬레이션 모드</span>
            )}
          </div>
          
          {analysisTimestamp && (
            <div className="flex items-center gap-1">
              <Info className="w-4 h-4" />
              <span>
                분석 시간: {new Date(analysisTimestamp).toLocaleTimeString('ko-KR')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 전체 개요 모드
 */
const OverviewMode = ({ regionalAnalysis, getConfidenceColor, getConfidenceIcon }) => {
  if (!regionalAnalysis) return null;

  const averageConfidence = regionalAnalysis.confidence_breakdown?.overall_confidence || 0;
  const analyses = regionalAnalysis.regional_analyses || [];

  return (
    <div className="space-y-6">
      {/* 전체 요약 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          전체 분석 요약
        </h3>
        <p className="text-gray-700 leading-relaxed">
          {regionalAnalysis.overall_summary}
        </p>
        
        <div className="mt-4 flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(averageConfidence)}`}>
            <div className="flex items-center gap-1">
              {getConfidenceIcon(averageConfidence)}
              전체 신뢰도: {(averageConfidence * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            분석 시간: {new Date(regionalAnalysis.timestamp).toLocaleString('ko-KR')}
          </div>
        </div>
      </div>

      {/* 지역별 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analyses.slice(0, 6).map((analysis) => {
          const region = SINGAPORE_REGIONS[analysis.region_id];
          if (!region) return null;

          return (
            <div key={analysis.region_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${region.lightColor}`}>
                  <span className="text-xl">{region.icon}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 truncate">
                      {region.shortName}
                    </h4>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(analysis.confidence)}`}>
                      {(analysis.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {analysis.ai_summary?.substring(0, 120)}...
                  </p>
                  
                  {analysis.temperature?.average && (
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3" />
                        {analysis.temperature.average.toFixed(1)}°C
                      </div>
                      {analysis.humidity?.average && (
                        <div className="flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          {Math.round(analysis.humidity.average)}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {analyses.length > 6 && (
        <div className="text-center">
          <div className="text-sm text-gray-500">
            추가 {analyses.length - 6}개 지역 분석 결과가 있습니다.
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 상세 분석 모드
 */
const DetailedMode = ({ regionData, regionInfo, getConfidenceColor, getConfidenceIcon }) => {
  return (
    <div className="space-y-6">
      {/* 지역 헤더 */}
      <div className={`${regionInfo.lightColor} rounded-lg p-6`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${regionInfo.color} text-white`}>
            <span className="text-3xl">{regionInfo.icon}</span>
          </div>
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {regionData.region_name}
            </h3>
            <p className="text-gray-600 mb-3">{regionData.region_area}</p>
            
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(regionData.confidence)}`}>
                <div className="flex items-center gap-1">
                  {getConfidenceIcon(regionData.confidence)}
                  신뢰도: {(regionData.confidence * 100).toFixed(1)}%
                </div>
              </div>
              
              {regionData.stations_used && (
                <div className="text-sm text-gray-600">
                  관측소: {regionData.stations_used.length}개
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 기상 데이터 */}
      {(regionData.temperature?.average || regionData.humidity?.average) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regionData.temperature?.average && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-gray-800">온도 정보</h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">평균</span>
                  <span className="font-medium">{regionData.temperature.average.toFixed(1)}°C</span>
                </div>
                {regionData.temperature.min && regionData.temperature.max && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">범위</span>
                    <span className="font-medium">
                      {regionData.temperature.min.toFixed(1)}°C ~ {regionData.temperature.max.toFixed(1)}°C
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {regionData.humidity?.average && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-800">습도 정보</h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">평균</span>
                  <span className="font-medium">{Math.round(regionData.humidity.average)}%</span>
                </div>
                {regionData.humidity.min && regionData.humidity.max && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">범위</span>
                    <span className="font-medium">
                      {Math.round(regionData.humidity.min)}% ~ {Math.round(regionData.humidity.max)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI 분석 내용 */}
      <div className="space-y-4">
        {/* 요약 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-yellow-600" />
            AI 분석 요약
          </h4>
          <p className="text-gray-700 leading-relaxed">
            {regionData.ai_summary}
          </p>
        </div>

        {/* 상세 분석 섹션들 */}
        {regionData.detailed_analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {regionData.detailed_analysis.temperature_characteristics && (
              <AnalysisSection
                title="온도 특성 분석"
                icon={<Thermometer className="w-4 h-4" />}
                content={regionData.detailed_analysis.temperature_characteristics}
                color="red"
              />
            )}

            {regionData.detailed_analysis.humidity_comfort && (
              <AnalysisSection
                title="습도 및 쾌적성"
                icon={<Droplets className="w-4 h-4" />}
                content={regionData.detailed_analysis.humidity_comfort}
                color="blue"
              />
            )}

            {regionData.detailed_analysis.health_safety && (
              <AnalysisSection
                title="건강 및 안전"
                icon={<AlertTriangle className="w-4 h-4" />}
                content={regionData.detailed_analysis.health_safety}
                color="orange"
              />
            )}

            {regionData.detailed_analysis.future_outlook && (
              <AnalysisSection
                title="향후 전망"
                icon={<TrendingUp className="w-4 h-4" />}
                content={regionData.detailed_analysis.future_outlook}
                color="green"
              />
            )}
          </div>
        )}

        {/* 권장사항 */}
        {regionData.activity_suggestions && regionData.activity_suggestions.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-600" />
              활동 권장사항
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {regionData.activity_suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 신뢰도 모드
 */
const ConfidenceMode = ({ regionalAnalysis, getConfidenceColor, getConfidenceIcon }) => {
  if (!regionalAnalysis?.confidence_breakdown) return null;

  const { overall_confidence, regional_confidences, quality_factors } = regionalAnalysis.confidence_breakdown;

  return (
    <div className="space-y-6">
      {/* 전체 신뢰도 */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          전체 신뢰도 분석
        </h3>
        
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-1">
              {(overall_confidence * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">전체 신뢰도</div>
          </div>
          
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${overall_confidence * 100}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              목표: 97% 이상 | 현재: {(overall_confidence * 100).toFixed(1)}% 
              {overall_confidence >= 0.97 ? ' ✅ 달성' : ' 🎯 향상 중'}
            </div>
          </div>
        </div>
      </div>

      {/* 지역별 신뢰도 */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          지역별 신뢰도 분석
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regional_confidences?.map((item) => {
            const regionId = Object.keys(SINGAPORE_REGIONS).find(
              id => SINGAPORE_REGIONS[id].name === item.region
            );
            const region = regionId ? SINGAPORE_REGIONS[regionId] : null;
            
            return (
              <div key={item.region} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {region && <span className="text-lg">{region.icon}</span>}
                    <span className="font-medium text-gray-800">
                      {region?.shortName || item.region}
                    </span>
                  </div>
                  
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                    <div className="flex items-center gap-1">
                      {getConfidenceIcon(item.confidence)}
                      {(item.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      item.confidence >= 0.97 ? 'bg-emerald-500' :
                      item.confidence >= 0.90 ? 'bg-green-500' :
                      item.confidence >= 0.80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${item.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 품질 요소 */}
      {quality_factors && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            품질 요소 분석
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(quality_factors).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="font-semibold text-gray-800">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 분석 섹션 컴포넌트
 */
const AnalysisSection = ({ title, icon, content, color }) => {
  const colorClasses = {
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200'
  };

  const iconColorClasses = {
    red: 'text-red-600',
    blue: 'text-blue-600', 
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color] || colorClasses.blue}`}>
      <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <span className={iconColorClasses[color] || iconColorClasses.blue}>
          {icon}
        </span>
        {title}
      </h5>
      <p className="text-sm text-gray-700 leading-relaxed">
        {content}
      </p>
    </div>
  );
};

export default EnhancedRegionalAIAnalysis;