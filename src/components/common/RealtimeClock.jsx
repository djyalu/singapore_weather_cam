import React, { useState, useEffect } from 'react';

const RealtimeClock = ({ className = "text-blue-100 text-xs font-mono" }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    console.log('🚀 RealtimeClock 마운트됨');
    
    const updateTime = () => {
      const now = new Date();
      // 싱가포르 시간을 12시간 형식으로 표시 (고정폭을 위해 패딩 추가)
      const timeString = now.toLocaleString('en-US', {
        timeZone: 'Asia/Singapore',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      // 시간 포맷을 더 일관되게 만들기 (AM/PM을 한국어로 변환)
      const formattedTime = timeString.replace('AM', '오전').replace('PM', '오후');
      
      setTime(formattedTime);
      console.log('🕘 Header 시계 업데이트:', formattedTime);
    };

    // 즉시 실행
    updateTime();
    
    // 1초마다 업데이트
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span 
      className={`${className} inline-block w-[140px] text-center font-mono`}
      style={{ 
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum"',
        letterSpacing: '0.05em'
      }}
    >
      {time}
    </span>
  );
};

export default RealtimeClock;