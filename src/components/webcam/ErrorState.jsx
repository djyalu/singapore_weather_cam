import React, { useState } from 'react';

/**
 * ErrorState Component
 *
 * Enhanced error handling component with better messaging and retry mechanisms
 * Features:
 * - Multiple error types with appropriate messaging
 * - Retry functionality with exponential backoff
 * - Accessibility compliant
 * - Mobile responsive design
 * - Progressive enhancement options
 */

const ErrorState = ({
  error,
  onRetry,
  retryAttempts = 0,
  maxRetries = 3,
  showDetails = false,
  variant = 'default', // 'default' | 'compact' | 'inline'
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(showDetails);

  // Determine error type and appropriate messaging
  const getErrorInfo = (errorMessage) => {
    const error = errorMessage?.toLowerCase() || '';

    if (error.includes('network') || error.includes('fetch')) {
      return {
        type: 'network',
        title: '네트워크 연결 오류',
        message: '인터넷 연결을 확인하고 다시 시도해주세요.',
        icon: '🌐',
        severity: 'error',
      };
    }

    if (error.includes('timeout')) {
      return {
        type: 'timeout',
        title: '요청 시간 초과',
        message: '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
        icon: '⏱️',
        severity: 'warning',
      };
    }

    if (error.includes('404') || error.includes('not found')) {
      return {
        type: 'not_found',
        title: '데이터를 찾을 수 없음',
        message: '요청한 카메라 데이터를 찾을 수 없습니다.',
        icon: '🔍',
        severity: 'warning',
      };
    }

    if (error.includes('403') || error.includes('unauthorized')) {
      return {
        type: 'unauthorized',
        title: '접근 권한 없음',
        message: '데이터에 접근할 권한이 없습니다.',
        icon: '🔒',
        severity: 'error',
      };
    }

    if (error.includes('500') || error.includes('server')) {
      return {
        type: 'server',
        title: '서버 오류',
        message: '서버에 일시적인 문제가 발생했습니다.',
        icon: '🔧',
        severity: 'error',
      };
    }

    // Generic error
    return {
      type: 'generic',
      title: '오류가 발생했습니다',
      message: '예상치 못한 오류가 발생했습니다. 다시 시도해주세요.',
      icon: '⚠️',
      severity: 'error',
    };
  };

  const errorInfo = getErrorInfo(error);
  const canRetry = retryAttempts < maxRetries && onRetry;

  // Calculate retry delay with exponential backoff
  const getRetryDelay = (attempt) => {
    return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
  };

  const handleRetry = async () => {
    if (!canRetry || isRetrying) {return;}

    setIsRetrying(true);

    try {
      const delay = getRetryDelay(retryAttempts);

      // Show retry countdown for longer delays
      if (delay > 2000) {
        const seconds = Math.ceil(delay / 1000);
        // You could implement a countdown here if needed
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      await onRetry();
    } catch (retryError) {
      // Error handling is done by parent component
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const getContainerClasses = () => {
    const base = 'text-center';

    switch (variant) {
      case 'compact':
        return `${base} py-4`;
      case 'inline':
        return `${base} py-2`;
      default:
        return `${base} py-8`;
    }
  };

  const getIconSize = () => {
    switch (variant) {
      case 'compact':
      case 'inline':
        return 'text-3xl';
      default:
        return 'text-5xl';
    }
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-xl">{errorInfo.icon}</span>
        <div className="text-left">
          <p className="text-sm font-medium text-red-800">{errorInfo.title}</p>
          <p className="text-xs text-red-600">{errorInfo.message}</p>
        </div>
        {canRetry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="btn-secondary text-xs px-3 py-1"
            aria-label={`재시도 (${retryAttempts + 1}/${maxRetries})`}
          >
            {isRetrying ? '재시도 중...' : '재시도'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <div className={getContainerClasses()} role="alert" aria-live="assertive">
        {/* Error icon */}
        <div className={`${getIconSize()} mb-4`} aria-hidden="true">
          {errorInfo.icon}
        </div>

        {/* Error title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {errorInfo.title}
        </h3>

        {/* Error message */}
        <p className="text-gray-600 mb-4 max-w-md mx-auto">
          {errorInfo.message}
        </p>

        {/* Error details toggle */}
        {error && (
          <button
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 underline"
            aria-expanded={showErrorDetails}
            aria-controls="error-details"
          >
            {showErrorDetails ? '자세한 내용 숨기기' : '자세한 내용 보기'}
          </button>
        )}

        {/* Error details */}
        {showErrorDetails && error && (
          <div
            id="error-details"
            className="bg-gray-50 border border-gray-200 rounded p-3 mb-4 text-left"
          >
            <h4 className="text-sm font-medium text-gray-700 mb-1">오류 세부사항:</h4>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
              {error}
            </pre>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {canRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`btn-primary ${isRetrying ? 'opacity-75 cursor-not-allowed' : ''}`}
              aria-label={`재시도 (${retryAttempts + 1}/${maxRetries})`}
            >
              {isRetrying ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  재시도 중...
                </span>
              ) : (
                `🔄 다시 시도 (${retryAttempts + 1}/${maxRetries})`
              )}
            </button>
          )}

          {/* Help or contact button */}
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            🔃 페이지 새로고침
          </button>
        </div>

        {/* Retry attempts indicator */}
        {retryAttempts > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            재시도 횟수: {retryAttempts}/{maxRetries}
          </div>
        )}

        {/* Additional help text */}
        <div className="mt-6 text-xs text-gray-500 max-w-lg mx-auto">
          <p>
            문제가 지속되면 브라우저를 새로고침하거나
            잠시 후 다시 방문해주세요.
          </p>
        </div>

        {/* Screen reader additional context */}
        <div className="sr-only">
          오류 유형: {errorInfo.type}.
          심각도: {errorInfo.severity}.
          {canRetry ? `재시도 가능. 남은 재시도 횟수: ${maxRetries - retryAttempts}회.` : '재시도 불가능.'}
        </div>
      </div>
    </div>
  );
};

ErrorState.displayName = 'ErrorState';

export default ErrorState;