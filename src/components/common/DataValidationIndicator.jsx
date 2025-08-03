import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * 날씨 데이터 검증 결과를 표시하는 인디케이터 컴포넌트
 */
const DataValidationIndicator = React.memo(({ validationResults, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!validationResults) {
    return null;
  }

  const { overall, score, checks, alerts } = validationResults;

  // 상태별 아이콘 및 색상 결정
  const getStatusConfig = () => {
    switch (overall) {
      case 'healthy':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: '정상',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: '주의',
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: '오류',
        };
      default:
        return {
          icon: Info,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: '알 수 없음',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  // 점수에 따른 막대 색상
  const getScoreBarColor = () => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg ${className}`}>
      {/* 헤더 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <StatusIcon className={`w-4 h-4 ${config.color} flex-shrink-0`} />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`text-sm font-medium ${config.color}`}>
              데이터 검증
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} border ${config.borderColor}`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">
              {score}점
            </span>
          </div>
        </div>

        {/* 점수 바 */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getScoreBarColor()}`}
              style={{ width: `${score}%` }}
            />
          </div>
          
          {/* 확장/축소 아이콘 */}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* 상세 정보 (확장 시) */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-3 space-y-3">
          {/* 검증 항목들 */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 mb-2">검증 항목</h4>
            {checks.map((check, index) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  {check.status === 'pass' ? (
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  ) : check.status === 'warning' ? (
                    <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-gray-700 truncate">{check.name}</span>
                </div>
                <span className={`
                  px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0
                  ${check.status === 'pass' 
                    ? 'bg-green-100 text-green-700' 
                    : check.status === 'warning'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                  }
                `}>
                  {check.score}점
                </span>
              </div>
            ))}
          </div>

          {/* 경고 및 알림 */}
          {alerts && alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-700 mb-2">알림 사항</h4>
              {alerts.slice(0, 3).map((alert, index) => (
                <div key={index} className={`
                  p-2 rounded text-xs
                  ${alert.level === 'error' 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }
                `}>
                  <div className="flex items-start gap-1">
                    {alert.level === 'error' ? (
                      <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="flex-1">{alert.message}</span>
                  </div>
                  {alert.source && (
                    <div className="text-xs opacity-70 mt-1">
                      출처: {alert.source}
                    </div>
                  )}
                </div>
              ))}
              {alerts.length > 3 && (
                <div className="text-xs text-gray-500">
                  ... 및 {alerts.length - 3}개 추가 알림
                </div>
              )}
            </div>
          )}

          {/* 데이터 품질 메트릭 */}
          {validationResults.dataQuality && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-700 mb-2">데이터 품질</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(validationResults.dataQuality).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 capitalize">
                      {key === 'completeness' ? '완전성' :
                       key === 'consistency' ? '일관성' :
                       key === 'timeliness' ? '시의성' :
                       key === 'accuracy' ? '정확성' : key}
                    </span>
                    <span className={`font-medium ${
                      value >= 90 ? 'text-green-600' :
                      value >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {Math.round(value)}점
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 타임스탬프 */}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            검증 시간: {new Date(validationResults.timestamp).toLocaleString('ko-KR')}
          </div>
        </div>
      )}
    </div>
  );
});

DataValidationIndicator.propTypes = {
  validationResults: PropTypes.shape({
    overall: PropTypes.oneOf(['healthy', 'warning', 'error']),
    score: PropTypes.number,
    checks: PropTypes.array,
    alerts: PropTypes.array,
    dataQuality: PropTypes.object,
    timestamp: PropTypes.string,
  }),
  className: PropTypes.string,
};

DataValidationIndicator.displayName = 'DataValidationIndicator';

export default DataValidationIndicator;