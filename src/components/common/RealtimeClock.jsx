import React, { useState, useEffect } from 'react';

const RealtimeClock = ({ className = "text-blue-100 text-xs font-mono" }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // 싱가포르 시간을 한국어 형식으로 표시
      const timeString = now.toLocaleString('ko-KR', {
        timeZone: 'Asia/Singapore',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      setTime(timeString);
    };

    // 즉시 실행
    updateTime();
    
    // 1초마다 업데이트
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span 
      className={`${className} inline-block w-[140px] text-center`}
      style={{ 
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum"'
      }}
    >
      {time}
    </span>
  );
};

export default RealtimeClock;