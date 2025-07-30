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
                <li>• 브라우저 새로고침 시도 (Ctrl+F5)</li>
                <li>• 네트워크 연결 상태 확인</li>
                <li>• 브라우저 JavaScript 활성화 확인</li>
                <li>• 광고 차단기에서 사이트 허용</li>
                <li>• 다른 브라우저에서 접속 시도</li>
                <li>• VPN 사용 시 일시 해제</li>
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