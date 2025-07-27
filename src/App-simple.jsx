import React from 'react';

/**
 * Simple App Component for Testing
 * Minimal implementation to verify basic React rendering
 */
const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🌤️ Singapore Weather Cam
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          실시간 날씨 정보 시스템
        </p>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-lg text-gray-800">
            시스템이 정상적으로 로딩되었습니다!
          </p>
          <p className="text-sm text-gray-500 mt-2">
            현재 시간: {new Date().toLocaleString('ko-KR', {
              timeZone: 'Asia/Singapore',
            })}
          </p>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          React 앱이 성공적으로 실행 중입니다
        </p>
      </div>
    </div>
  );
};

export default App;