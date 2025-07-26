import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const LiveWebcamFeed = ({ webcam }) => {
  const { name, location, file_info } = webcam;
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [updateTime, setUpdateTime] = useState(new Date());

  // 이미지 URL 생성
  const basePath = import.meta.env.BASE_URL || '/';
  const baseImageUrl = file_info?.source_url || file_info?.url ||
    (file_info?.path ? `${basePath}${file_info.path}` : `${basePath}images/placeholder.jpg`);

  useEffect(() => {
    let interval;

    if (isPlaying) {
      // 실시간 효과를 위해 5초마다 이미지 업데이트
      interval = setInterval(() => {
        const timestamp = Date.now();
        setImageUrl(`${baseImageUrl}${baseImageUrl.includes('?') ? '&' : '?'}t=${timestamp}`);
        setUpdateTime(new Date());
      }, 5000);
    }

    return () => {
      if (interval) {clearInterval(interval);}
    };
  }, [isPlaying, baseImageUrl]);

  // 초기 이미지 설정
  useEffect(() => {
    setImageUrl(`${baseImageUrl}${baseImageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`);
  }, [baseImageUrl]);

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={imageUrl}
          alt={`${name} live view`}
          className="w-full h-full object-cover"
        />

        {/* 실시간 표시 오버레이 */}
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <span className={`inline-block w-3 h-3 rounded-full ${isPlaying ? 'bg-red-600 animate-pulse' : 'bg-gray-600'}`}></span>
          <span className="text-white text-sm font-medium">
            {isPlaying ? 'LIVE' : 'PAUSED'}
          </span>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            {isPlaying ? '⏸ 일시정지' : '▶ 재생'}
          </button>

          <div className="text-white text-sm">
            마지막 업데이트: {updateTime.toLocaleTimeString('ko-KR')}
          </div>
        </div>

        {/* 위치 정보 */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded">
          <p className="text-xs">{location}</p>
        </div>
      </div>

      {/* 정보 패널 */}
      <div className="p-4 bg-gray-800 text-white">
        <h3 className="text-lg font-semibold mb-2">{name}</h3>
        <p className="text-sm text-gray-400">
          {isPlaying
            ? '5초마다 자동으로 이미지가 새로고침됩니다.'
            : '재생 버튼을 눌러 실시간 업데이트를 시작하세요.'}
        </p>
      </div>
    </div>
  );
};

LiveWebcamFeed.propTypes = {
  webcam: PropTypes.shape({
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    file_info: PropTypes.shape({
      source_url: PropTypes.string,
      url: PropTypes.string,
      path: PropTypes.string,
    }),
  }).isRequired,
};

export default LiveWebcamFeed;