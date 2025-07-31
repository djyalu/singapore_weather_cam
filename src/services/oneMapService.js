/**
 * Singapore OneMap API 서비스
 * 공식 Singapore 정부 지도 서비스
 */

class OneMapService {
  constructor() {
    this.baseURL = 'https://www.onemap.gov.sg/api';
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * OneMap API 인증 토큰 획득
   */
  async getAuthToken() {
    // 하드코딩된 유효한 토큰 사용
    const hardcodedToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo4MTA1LCJmb3JldmVyIjpmYWxzZSwiaXNzIjoiT25lTWFwIiwiaWF0IjoxNzUzOTczNDc0LCJuYmYiOjE3NTM5NzM0NzQsImV4cCI6MTc1NDIzMjY3NCwianRpIjoiNjY3YWJiYmYtYzQ2My00NzY0LWE4ODItODIxNmM3ODFlYWQ1In0.M0miFDP4vrSDFu9wx0DAGCSISy8SfLN66vWEya91kaAFDAlvS0oJoJ4ZpU4JqGriYdqznwSnEBqdsgJ6Y8qJ0xXYYqB73PUkwTXN1qcYMCqEPymfXmWUDDs_Fd8x4JK-bAGsM4XgNsj-XKh8UkqNdF9yfkqyghK3Q6e4I9G4coMxObqe5Pdt-HzZDzTdPmDw_WmvOm4_3B876b00hxm43h_pZUnSSe0cwgMN4iBifuRGp2o0AqXw0lOltxnoDWWIqtsse9tSsqFbM4SqY2hXHYt1CwI62_ug_wab-jr8WTu0I-9LScVhJ3tVRHTYCTKGn8mMUqxKb6lNgmMoBZTGGQ';
    
    // 토큰 유효기간 확인 (JWT exp: 1754232674 = 2025-02-03 08:31:14 UTC)
    const tokenExpiry = new Date(1754232674 * 1000); // 2025-02-03
    
    if (new Date() < tokenExpiry) {
      this.token = hardcodedToken;
      this.tokenExpiry = tokenExpiry;
      console.log('✅ OneMap JWT 토큰 활성화 (유효기간: 2025-02-03)');
      return this.token;
    } else {
      console.warn('⚠️ OneMap 토큰이 만료되었습니다');
      return null;
    }
  }

  /**
   * 주소 검색 (Geocoding)
   */
  async searchAddress(query) {
    try {
      const response = await fetch(
        `${this.baseURL}/common/elastic/search?searchVal=${encodeURIComponent(query)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
      );
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('주소 검색 실패:', error);
      return [];
    }
  }

  /**
   * 좌표 → 주소 변환 (Reverse Geocoding)
   */
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `${this.baseURL}/public/revgeocode?location=${lat},${lng}&token=${await this.getAuthToken()}&buffer=10&addressType=All`
      );
      
      const data = await response.json();
      return data.GeocodeInfo || [];
    } catch (error) {
      console.error('역 지오코딩 실패:', error);
      return [];
    }
  }

  /**
   * 경로 찾기 (Routing)
   */
  async getRoute(startLat, startLng, endLat, endLng, routeType = 'drive') {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(
        `${this.baseURL}/public/routingsvc/route?start=${startLat},${startLng}&end=${endLat},${endLng}&routeType=${routeType}&token=${token}`
      );
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('경로 찾기 실패:', error);
      return null;
    }
  }

  /**
   * 테마별 지도 타일 URL 생성
   */
  getTileURL(style = 'Default', z, x, y) {
    const styles = {
      'Default': 'Default',
      'Night': 'Night',
      'Original': 'Original', 
      'Grey': 'Grey',
      'Satellite': 'Satellite'
    };
    
    const selectedStyle = styles[style] || 'Default';
    return `https://maps-{s}.onemap.sg/v3/${selectedStyle}/{z}/{x}/{y}.png`;
  }

  /**
   * 지도 스타일 목록
   */
  getAvailableStyles() {
    return [
      { id: 'Default', name: '기본 지도', description: '일반적인 도로 지도' },
      { id: 'Satellite', name: '위성 지도', description: '위성 이미지 기반' },
      { id: 'Night', name: '야간 모드', description: '어두운 테마 지도' },
      { id: 'Grey', name: '회색 지도', description: '단색 배경 지도' },
      { id: 'Original', name: '오리지널', description: '전통적인 지도 스타일' }
    ];
  }
}

export default new OneMapService();