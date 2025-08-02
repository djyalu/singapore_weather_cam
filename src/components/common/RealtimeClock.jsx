import React, { useState, useEffect } from 'react';

const RealtimeClock = ({ className = "text-blue-100 text-xs font-mono" }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    console.log('🚀 RealtimeClock 마운트됨');
    
    const updateTime = () => {
      const now = new Date();
      // 직접 싱가포르 시간 계산 (UTC+8)
      const singaporeTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Singapore"}));
      
      const year = singaporeTime.getFullYear();
      const month = String(singaporeTime.getMonth() + 1).padStart(2, '0');
      const day = String(singaporeTime.getDate()).padStart(2, '0');
      const hours = String(singaporeTime.getHours()).padStart(2, '0');
      const minutes = String(singaporeTime.getMinutes()).padStart(2, '0');
      const seconds = String(singaporeTime.getSeconds()).padStart(2, '0');
      
      const timeString = `${hours}:${minutes}:${seconds}`;
      setTime(timeString);
      console.log('🕘 Header 시계 업데이트:', timeString);
    };

    // 즉시 실행
    updateTime();
    
    // 1초마다 업데이트
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className={className}>
      🕘 {time} SGT
    </span>
  );
};

export default RealtimeClock;