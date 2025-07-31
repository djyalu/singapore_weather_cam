import React, { useEffect, useRef, useState } from 'react';
import oneMapService from '../../services/oneMapService';

/**
 * OneMap API 실제 테스트 컴포넌트
 * JWT 토큰을 사용한 실제 API 호출 테스트
 */
const OneMapTestComponent = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [token, setToken] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [apiStatus, setApiStatus] = useState({
    token: '대기중',
    search: '대기중',
    routing: '대기중',
    reverseGeocode: '대기중'
  });

  // Singapore 중심 좌표
  const SGP_CENTER = [1.3521, 103.8198];

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initializeMap();
    testAllAPIs();
  }, []);

  // 지도 초기화
  const initializeMap = () => {
    if (!mapRef.current || typeof window.L === 'undefined') return;

    const leafletMap = window.L.map(mapRef.current, {
      center: SGP_CENTER,
      zoom: 12
    });

    // OneMap 타일 레이어 (토큰 없이도 작동)
    window.L.tileLayer('https://maps-{s}.onemap.sg/v3/Default/{z}/{x}/{y}.png', {
      attribution: '© OneMap © Singapore Land Authority',
      subdomains: ['a', 'b', 'c', 'd']
    }).addTo(leafletMap);

    setMap(leafletMap);
    console.log('✅ OneMap 지도 초기화 완료');
  };

  // 모든 API 테스트
  const testAllAPIs = async () => {
    console.log('🚀 OneMap API 테스트 시작...');
    
    // 1. 토큰 테스트
    await testToken();
    
    // 2. 주소 검색 테스트
    await testSearch();
    
    // 3. 역 지오코딩 테스트
    await testReverseGeocode();
    
    // 4. 경로 찾기 테스트
    await testRouting();
  };

  // 토큰 테스트
  const testToken = async () => {
    try {
      setApiStatus(prev => ({ ...prev, token: '테스트 중...' }));
      
      const authToken = await oneMapService.getAuthToken();
      
      if (authToken) {
        setToken(authToken);
        setApiStatus(prev => ({ ...prev, token: '✅ 성공' }));
        console.log('✅ OneMap 토큰 검증 성공');
      } else {
        setApiStatus(prev => ({ ...prev, token: '❌ 실패' }));
        console.error('❌ OneMap 토큰 검증 실패');
      }
    } catch (error) {
      setApiStatus(prev => ({ ...prev, token: '❌ 오류' }));
      console.error('OneMap 토큰 오류:', error);
    }
  };

  // 주소 검색 테스트
  const testSearch = async () => {
    try {
      setApiStatus(prev => ({ ...prev, search: '테스트 중...' }));
      
      const results = await oneMapService.searchAddress('Marina Bay Sands');
      
      if (results && results.length > 0) {
        setSearchResults(results.slice(0, 3)); // 상위 3개 결과만
        setApiStatus(prev => ({ ...prev, search: '✅ 성공' }));
        console.log('✅ OneMap 주소 검색 성공:', results.length, '개 결과');
        
        // 첫 번째 결과를 지도에 표시
        if (map && results[0]) {
          const lat = parseFloat(results[0].LATITUDE);
          const lng = parseFloat(results[0].LONGITUDE);
          
          window.L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`
              <strong>🔍 ${results[0].SEARCHVAL}</strong><br>
              <small>${results[0].ADDRESS}</small>
            `)
            .openPopup();
            
          map.setView([lat, lng], 16);
        }
      } else {
        setApiStatus(prev => ({ ...prev, search: '⚠️ 결과 없음' }));
      }
    } catch (error) {
      setApiStatus(prev => ({ ...prev, search: '❌ 오류' }));
      console.error('OneMap 주소 검색 오류:', error);
    }
  };

  // 역 지오코딩 테스트
  const testReverseGeocode = async () => {
    try {
      setApiStatus(prev => ({ ...prev, reverseGeocode: '테스트 중...' }));
      
      // Marina Bay Sands 좌표로 테스트
      const result = await oneMapService.reverseGeocode(1.2834, 103.8607);
      
      if (result && result.length > 0) {
        setApiStatus(prev => ({ ...prev, reverseGeocode: '✅ 성공' }));
        console.log('✅ OneMap 역 지오코딩 성공:', result[0]);
        
        // 지도에 결과 표시
        if (map) {
          window.L.marker([1.2834, 103.8607])
            .addTo(map)
            .bindPopup(`
              <strong>📍 역 지오코딩 결과</strong><br>
              <small>${result[0]?.ROAD || '주소 정보'}</small>
            `);
        }
      } else {
        setApiStatus(prev => ({ ...prev, reverseGeocode: '⚠️ 결과 없음' }));
      }
    } catch (error) {
      setApiStatus(prev => ({ ...prev, reverseGeocode: '❌ 오류' }));
      console.error('OneMap 역 지오코딩 오류:', error);
    }
  };

  // 경로 찾기 테스트
  const testRouting = async () => {
    try {
      setApiStatus(prev => ({ ...prev, routing: '테스트 중...' }));
      
      // Orchard Road → Marina Bay Sands 경로
      const result = await oneMapService.getRoute(
        1.3048, 103.8318, // Orchard Road
        1.2834, 103.8607, // Marina Bay Sands
        'drive'
      );
      
      if (result && result.route) {
        setApiStatus(prev => ({ ...prev, routing: '✅ 성공' }));
        console.log('✅ OneMap 경로 찾기 성공:', result);
        
        // 지도에 경로 표시 (간단한 직선으로)
        if (map) {
          const route = window.L.polyline([
            [1.3048, 103.8318],
            [1.2834, 103.8607]
          ], { color: 'blue', weight: 4 }).addTo(map);
          
          // 시작점과 끝점 마커
          window.L.marker([1.3048, 103.8318])
            .addTo(map)
            .bindPopup('🚗 출발: Orchard Road');
            
          window.L.marker([1.2834, 103.8607])
            .addTo(map)
            .bindPopup('🏁 도착: Marina Bay Sands');
        }
      } else {
        setApiStatus(prev => ({ ...prev, routing: '⚠️ 결과 없음' }));
      }
    } catch (error) {
      setApiStatus(prev => ({ ...prev, routing: '❌ 오류' }));
      console.error('OneMap 경로 찾기 오류:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🗺️ OneMap API 실제 테스트
        </h1>
        <p className="text-gray-600">
          JWT 토큰을 사용한 Singapore OneMap API 기능 테스트
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 지도 영역 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-semibold text-gray-800">실시간 지도</h2>
          </div>
          <div 
            ref={mapRef} 
            className="w-full h-96"
            style={{ background: '#f8fafc' }}
          />
        </div>

        {/* API 상태 패널 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="font-semibold text-gray-800 mb-4">API 테스트 상태</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">🔑 JWT 토큰</span>
              <span className={`px-2 py-1 rounded text-sm ${
                apiStatus.token.includes('✅') ? 'bg-green-100 text-green-800' : 
                apiStatus.token.includes('❌') ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {apiStatus.token}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">🔍 주소 검색</span>
              <span className={`px-2 py-1 rounded text-sm ${
                apiStatus.search.includes('✅') ? 'bg-green-100 text-green-800' : 
                apiStatus.search.includes('❌') ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {apiStatus.search}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">📍 역 지오코딩</span>
              <span className={`px-2 py-1 rounded text-sm ${
                apiStatus.reverseGeocode.includes('✅') ? 'bg-green-100 text-green-800' : 
                apiStatus.reverseGeocode.includes('❌') ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {apiStatus.reverseGeocode}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">🛣️ 경로 찾기</span>
              <span className={`px-2 py-1 rounded text-sm ${
                apiStatus.routing.includes('✅') ? 'bg-green-100 text-green-800' : 
                apiStatus.routing.includes('❌') ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {apiStatus.routing}
              </span>
            </div>
          </div>

          {/* 토큰 정보 */}
          {token && (
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">토큰 정보</h3>
              <div className="text-xs text-blue-600 font-mono break-all">
                {token.substring(0, 50)}...
              </div>
              <div className="text-xs text-blue-500 mt-1">
                유효기간: 2025-02-03 까지
              </div>
            </div>
          )}

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-800 mb-3">검색 결과</h3>
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm">{result.SEARCHVAL}</div>
                    <div className="text-xs text-gray-600 mt-1">{result.ADDRESS}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      📍 {parseFloat(result.LATITUDE).toFixed(4)}, {parseFloat(result.LONGITUDE).toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 재테스트 버튼 */}
          <div className="mt-6">
            <button
              onClick={testAllAPIs}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 API 재테스트
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneMapTestComponent;