import React from 'react';

const SingaporeOverallWeatherTest = () => {
  console.log('🌏 TEST COMPONENT RENDERING');
  
  return (
    <div className="bg-red-500 text-white p-8 rounded-xl shadow-xl mb-8" style={{ minHeight: '150px' }}>
      <h1 className="text-2xl font-bold">🇸🇬 TEST: Singapore Weather Component</h1>
      <p className="mt-4">이 컴포넌트가 보이면 렌더링이 정상적으로 작동하고 있습니다!</p>
      <p className="mt-2">현재 시간: {new Date().toLocaleString('ko-KR')}</p>
    </div>
  );
};

export default SingaporeOverallWeatherTest;