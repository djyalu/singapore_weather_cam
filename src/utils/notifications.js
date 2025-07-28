// 사용자 알림 시스템
let notificationContainer = null;

// 알림 컨테이너 생성
const createNotificationContainer = () => {
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(notificationContainer);
  }
  return notificationContainer;
};

// 알림 표시
export const showNotification = (message, type = 'info', duration = 5000) => {
  const container = createNotificationContainer();
  
  const notification = document.createElement('div');
  notification.className = `
    max-w-sm p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full
    ${type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-black' :
      'bg-blue-500 text-white'}
  `;
  
  notification.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="flex-1 text-sm font-medium">${message}</span>
      <button class="text-white hover:bg-white/20 rounded p-1" onclick="this.parentElement.parentElement.remove()">
        ✕
      </button>
    </div>
  `;
  
  container.appendChild(notification);
  
  // 슬라이드 인 애니메이션
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 10);
  
  // 자동 제거
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  }, duration);
};

// 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.showNotification = showNotification;
}