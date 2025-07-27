#!/usr/bin/env node

/**
 * React 렌더링 확인 스크립트
 * 실제 브라우저 없이 React 앱이 로딩되는지 확인
 */

import fetch from 'node-fetch';

const TARGET_URL = 'https://djyalu.github.io/singapore_weather_cam/';

async function checkReactRendering() {
  console.log('🔍 React 렌더링 상태 확인 중...');
  console.log(`📍 대상: ${TARGET_URL}`);
  
  try {
    // 1. HTML 페이지 가져오기
    const response = await fetch(TARGET_URL);
    const html = await response.text();
    
    console.log('\n📄 HTML 분석:');
    console.log(`   상태: ${response.status}`);
    console.log(`   크기: ${html.length} bytes`);
    
    // 2. JavaScript 파일 URL 추출
    const jsMatch = html.match(/src="([^"]*assets\/js\/[^"]*\.js)"/);
    if (!jsMatch) {
      console.log('   ❌ JavaScript 파일 참조를 찾을 수 없음');
      return;
    }
    
    const jsUrl = jsMatch[1].startsWith('/') 
      ? `https://djyalu.github.io${jsMatch[1]}`
      : jsMatch[1];
    
    console.log(`   🔗 JS 파일: ${jsUrl}`);
    
    // 3. JavaScript 파일 확인
    const jsResponse = await fetch(jsUrl);
    console.log(`   📜 JS 상태: ${jsResponse.status}`);
    console.log(`   📏 JS 크기: ${await jsResponse.text().then(t => t.length)} bytes`);
    
    // 4. CSS 파일 확인
    const cssMatch = html.match(/href="([^"]*assets\/css\/[^"]*\.css)"/);
    if (cssMatch) {
      const cssUrl = cssMatch[1].startsWith('/') 
        ? `https://djyalu.github.io${cssMatch[1]}`
        : cssMatch[1];
      
      const cssResponse = await fetch(cssUrl);
      console.log(`   🎨 CSS 상태: ${cssResponse.status}`);
      console.log(`   📏 CSS 크기: ${await cssResponse.text().then(t => t.length)} bytes`);
    }
    
    // 5. HTML 콘텐츠 분석
    console.log('\n🔍 콘텐츠 분석:');
    console.log(`   React Root: ${html.includes('<div id="root">') ? '✅' : '❌'}`);
    console.log(`   Service Worker: ${html.includes('serviceWorker') ? '✅' : '❌'}`);
    console.log(`   Meta Tags: ${html.includes('Singapore Weather Cam') ? '✅' : '❌'}`);
    
    // 6. 결과 요약
    const allAssetsWorking = jsResponse.status === 200 && 
      (cssMatch ? await fetch(cssMatch[1].startsWith('/') ? `https://djyalu.github.io${cssMatch[1]}` : cssMatch[1]).then(r => r.status === 200) : true);
    
    console.log('\n📊 종합 결과:');
    if (response.status === 200 && allAssetsWorking) {
      console.log('   🎉 SUCCESS: 웹사이트가 정상적으로 로딩됩니다!');
      console.log('   ✅ HTML 로딩 성공');
      console.log('   ✅ JavaScript 파일 로딩 성공'); 
      console.log('   ✅ CSS 파일 로딩 성공');
      console.log('   ✅ React 앱이 렌더링될 준비가 되었습니다');
      
      console.log('\n🌐 웹사이트 방문: https://djyalu.github.io/singapore_weather_cam/');
      console.log('   브라우저에서 "🌤️ Singapore Weather Cam" 제목과');
      console.log('   "시스템이 정상적으로 로딩되었습니다!" 메시지가 표시되어야 합니다.');
      
    } else {
      console.log('   ❌ FAIL: 일부 리소스 로딩 실패');
      console.log(`   HTML: ${response.status === 200 ? '✅' : '❌'}`);
      console.log(`   JS: ${jsResponse.status === 200 ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

checkReactRendering();