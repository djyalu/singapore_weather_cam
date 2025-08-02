import React, { useState, useEffect } from 'react';

const SimpleClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    console.log('🚀 SimpleClock 시작됨');
    
    const timer = setInterval(() => {
      const now = new Date();
      // 싱가포르 시간 (UTC+8)
      const singaporeTime = new Date(now.getTime() + (8 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
      setTime(singaporeTime);
      console.log('⏰ 시계 업데이트:', singaporeTime.toTimeString());
    }, 1000);

    return () => {
      console.log('🛑 SimpleClock 정리됨');
      clearInterval(timer);
    };
  }, []);

  const formatTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <span className="font-mono text-xs">
      🕘 {formatTime(time)} SGT
    </span>
  );
};

export default SimpleClock;