import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Clock, RefreshCw, Zap, Info, Calendar, Gauge, X } from 'lucide-react';

/**
 * 데이터 동기화 가이드 컴포넌트
 * 자동 수집 주기와 수동 새로고침 기능을 사용자에게 안내
 */
const DataSyncGuide = React.memo(({ 
  onRefresh, 
  onForceRefresh, 
  isRefreshing = false, 
  lastUpdate = null,
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatLastUpdate = (date) => {
    if (!date) return '업데이트 정보 없음';
    
    try {
      const now = new Date();
      const updateTime = new Date(date);
      const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
      
      if (diffMinutes < 1) return '방금 전';
      if (diffMinutes < 60) return `${diffMinutes}분 전`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}시간 전`;
      
      return updateTime.toLocaleDateString('ko-KR');
    } catch (error) {
      return '시간 정보 오류';
    }
  };

  const getNextAutoUpdate = () => {
    try {
      const now = new Date();
      const nextUpdate = new Date(now);
      nextUpdate.setHours(Math.floor(now.getHours() / 6) * 6 + 6, 0, 0, 0);
      
      const diffMinutes = Math.floor((nextUpdate - now) / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const remainingMinutes = diffMinutes % 60;
      
      if (diffHours > 0) {
        return `${diffHours}시간 ${remainingMinutes}분 후`;
      }
      return `${remainingMinutes}분 후`;
    } catch (error) {
      return '계산 오류';
    }
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      {/* 간단한 헤더 */}
      <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-800">
              데이터 동기화 정보
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600">
              {isExpanded ? '접기' : '더보기'}
            </span>
            <button
              className="p-1 hover:bg-blue-100 rounded-md transition-colors"
              aria-label={isExpanded ? '정보 접기' : '정보 펼치기'}
            >
              <X 
                className={`w-4 h-4 text-blue-600 transition-transform ${
                  isExpanded ? 'rotate-45' : ''
                }`} 
              />
            </button>
          </div>
        </div>
      </div>

      {/* 확장된 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {/* 자동 수집 정보 */}
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">자동 데이터 수집</h4>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>수집 주기:</span>
                  <span className="font-medium">6시간마다</span>
                </div>
                <div className="flex justify-between">
                  <span>다음 수집:</span>
                  <span className="font-medium text-blue-600">{getNextAutoUpdate()}</span>
                </div>
                <div className="flex justify-between">
                  <span>마지막 업데이트:</span>
                  <span className="font-medium">{formatLastUpdate(lastUpdate)}</span>
                </div>
                <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                  <Gauge className="w-3 h-3 inline mr-1" />
                  GitHub Actions 한도 30% 사용 (최적화됨)
                </div>
              </div>
            </div>

            {/* 수동 새로고침 정보 */}
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-orange-600" />
                <h4 className="text-sm font-medium text-orange-800">수동 새로고침</h4>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium 
                      text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 
                      rounded-md transition-colors min-h-[36px]"
                    title="캐시된 데이터 새로고침"
                  >
                    <RefreshCw 
                      className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} 
                    />
                    일반
                  </button>
                  <button
                    onClick={onForceRefresh}
                    disabled={isRefreshing}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium 
                      text-orange-600 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 
                      rounded-md transition-colors min-h-[36px]"
                    title="서버에서 최신 데이터 가져오기"
                  >
                    <Zap className="w-3 h-3" />
                    강제
                  </button>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>• <strong>일반</strong>: 캐시 활용한 빠른 새로고침</div>
                  <div>• <strong>강제</strong>: 서버에서 최신 데이터 수집</div>
                  <div className="text-blue-600 font-medium mt-2">
                    💡 자주 새로고침하려면 수동 버튼을 이용하세요!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 추가 안내 */}
          <div className="mt-4 p-3 bg-blue-25 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">효율적인 데이터 사용법</p>
                <ul className="space-y-1 text-blue-600">
                  <li>• 자동 수집은 GitHub Actions 무료 한도를 고려하여 6시간마다 실행됩니다</li>
                  <li>• 최신 정보가 필요할 때는 우상단의 새로고침 버튼을 사용하세요</li>
                  <li>• 강제 새로고침은 서버 부하를 줄이기 위해 필요할 때만 사용해주세요</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

DataSyncGuide.propTypes = {
  onRefresh: PropTypes.func,
  onForceRefresh: PropTypes.func,
  isRefreshing: PropTypes.bool,
  lastUpdate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ]),
  className: PropTypes.string,
};

DataSyncGuide.displayName = 'DataSyncGuide';

export default DataSyncGuide;