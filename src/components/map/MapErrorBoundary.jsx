import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Map-specific error boundary with specialized handling
 */
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Map Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="map-error-fallback bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="max-w-md mx-auto">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              지도 로딩 중 오류 발생
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Leaflet 지도를 불러오는 중 문제가 발생했습니다. 
              {this.state.retryCount > 0 && ` (재시도 ${this.state.retryCount}회)`}
            </p>
            
            {/* 에러 유형별 해결책 제시 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
              <h4 className="font-medium text-blue-800 mb-2">해결 방법:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Hard Refresh:</strong> Ctrl+F5 또는 Cmd+Shift+R</li>
                <li>• <strong>브라우저 캐시 삭제:</strong> 개발자 도구 &gt; 네트워크 탭 &gt; Disable cache</li>
                <li>• <strong>JavaScript 확인:</strong> 브라우저 설정에서 JavaScript 활성화</li>
                <li>• <strong>광고 차단기:</strong> 이 사이트에서 광고 차단기 비활성화</li>
                <li>• <strong>CORS 이슈:</strong> 다른 브라우저(Chrome, Firefox, Safari) 시도</li>
                <li>• <strong>네트워크:</strong> VPN/프록시 일시 해제, WiFi 재연결</li>
                <li>• <strong>브라우저 업데이트:</strong> 최신 버전 확인</li>
              </ul>
            </div>

            {/* 추가적인 기술적 정보 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
              <h4 className="font-medium text-yellow-800 mb-2">기술적 원인:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Leaflet 라이브러리 로딩 실패</li>
                <li>• 타일 서버 (OpenStreetMap) 접근 차단</li>
                <li>• 브라우저 CORS 정책 충돌</li>
                <li>• 메모리 부족 또는 리소스 제한</li>
              </ul>
            </div>

            <button 
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              지도 다시 로드
            </button>

            {/* 개발 모드에서 에러 상세 정보 표시 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  개발자 정보 (클릭하여 확장)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-red-600 max-h-32 overflow-y-auto">
                  <div className="font-bold mb-1">Error:</div>
                  <div className="mb-2">{this.state.error.toString()}</div>
                  {this.state.errorInfo && (
                    <>
                      <div className="font-bold mb-1">Stack Trace:</div>
                      <div>{this.state.errorInfo.componentStack}</div>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

MapErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MapErrorBoundary;