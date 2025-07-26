// 이미지 관리 유틸리티

/**
 * 이미지 URL 검증 및 fallback 처리
 */
export const getValidImageUrl = (imageUrl, basePath = '/') => {
  if (!imageUrl) {
    return `${basePath}images/placeholder.jpg`;
  }

  // 로컬 경로인 경우 basePath 추가
  if (imageUrl.startsWith('/') && !imageUrl.startsWith(basePath)) {
    return `${basePath}${imageUrl.substring(1)}`;
  }

  return imageUrl;
};

/**
 * 이미지 사전 로드
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * 여러 이미지 사전 로드
 */
export const preloadImages = async (urls) => {
  const results = await Promise.allSettled(
    urls.map(url => preloadImage(url)),
  );

  return {
    successful: results.filter(r => r.status === 'fulfilled').map(r => r.value),
    failed: results.filter(r => r.status === 'rejected').map(r => r.reason),
  };
};

/**
 * 이미지 URL에 캐시 버스터 추가
 */
export const addCacheBuster = (url, timestamp = Date.now()) => {
  if (!url) {return url;}

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${timestamp}`;
};

/**
 * 이미지 크기 최적화를 위한 URL 생성
 */
export const getOptimizedImageUrl = (url, width = 800, height = 600, quality = 80) => {
  if (!url || url.startsWith('/')) {
    // 로컬 이미지는 최적화 없이 반환
    return url;
  }

  // Unsplash URL인 경우 파라미터 추가
  if (url.includes('unsplash.com')) {
    return `${url}?w=${width}&h=${height}&q=${quality}&fit=crop`;
  }

  return url;
};

/**
 * 웹캠 이미지 fallback 체인 생성
 */
export const createWebcamFallbackChain = (webcamId, basePath = '/') => {
  return [
    `${basePath}images/webcam/${webcamId}.jpg`,
    `${basePath}images/webcam/${webcamId}_backup.jpg`,
    `${basePath}images/placeholder.jpg`,
  ];
};

/**
 * 이미지 로딩 상태 관리 훅에서 사용할 유틸리티
 */
export const imageLoadingStates = {
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  RETRYING: 'retrying',
};