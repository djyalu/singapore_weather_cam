import React from 'react';

/**
 * Simple App Component for Emergency Fix
 * Minimal implementation to verify basic React rendering
 */
const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">
            🌤️ Singapore Weather Cam
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            실시간 날씨 정보 시스템
          </p>
          <p className="text-lg text-gray-600">
            Real-time Weather Information System
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="text-green-600 text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            시스템이 정상적으로 로딩되었습니다!
          </h2>
          <p className="text-gray-600 mb-4">
            React 애플리케이션이 성공적으로 실행 중입니다.
          </p>
          
          {/* Current Time */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500 mb-1">현재 싱가포르 시간:</p>
            <p className="text-xl font-mono font-bold text-blue-600">
              {new Date().toLocaleString('ko-KR', {
                timeZone: 'Asia/Singapore',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>

          {/* Status Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="font-semibold text-green-800">React</div>
              <div className="text-green-600">정상 작동</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="font-semibold text-blue-800">빌드</div>
              <div className="text-blue-600">성공</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="font-semibold text-purple-800">배포</div>
              <div className="text-purple-600">완료</div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="text-gray-500 text-sm">
          <p className="mb-2">🔧 이 페이지가 정상 표시되면 기본 React 렌더링이 작동합니다.</p>
          <p>다음 단계에서 전체 기능을 점진적으로 복원하겠습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default App;