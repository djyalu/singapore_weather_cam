#!/usr/bin/env node

/**
 * Browser Debug Script
 * Simulates browser loading and checks for potential JavaScript errors
 */

import fetch from 'node-fetch';

const TARGET_URL = 'https://djyalu.github.io/singapore_weather_cam/';

async function debugBrowserIssues() {
  console.log('🔍 브라우저 렌더링 문제 디버깅...');
  
  try {
    // Get the main HTML
    const response = await fetch(TARGET_URL);
    const html = await response.text();
    
    console.log('\n📄 HTML 분석:');
    console.log(`   크기: ${html.length} bytes`);
    
    // Check for React root
    const hasReactRoot = html.includes('<div id="root">');
    console.log(`   React Root: ${hasReactRoot ? '✅' : '❌'}`);
    
    // Extract script sources
    const scriptMatches = html.match(/src="([^"]*\.js[^"]*)"/g) || [];
    console.log(`   JavaScript 파일 수: ${scriptMatches.length}`);
    
    for (const match of scriptMatches) {
      const src = match.match(/src="([^"]*)"/)[1];
      const fullUrl = src.startsWith('http') ? src : `https://djyalu.github.io${src}`;
      console.log(`   📜 ${src}`);
      
      try {
        const jsResponse = await fetch(fullUrl);
        console.log(`      상태: ${jsResponse.status} ${jsResponse.ok ? '✅' : '❌'}`);
        
        if (jsResponse.ok) {
          const jsContent = await jsResponse.text();
          console.log(`      크기: ${jsContent.length} bytes`);
          
          // Check for common React/Vite patterns
          const hasReact = jsContent.includes('React') || jsContent.includes('jsx');
          const hasVite = jsContent.includes('vite') || jsContent.includes('__vite');
          const hasError = jsContent.includes('Error') || jsContent.includes('throw');
          
          console.log(`      React 코드: ${hasReact ? '✅' : '❌'}`);
          console.log(`      Vite 관련: ${hasVite ? '✅' : '❌'}`);
          console.log(`      에러 가능성: ${hasError ? '⚠️' : '✅'}`);
          
          // Check for import errors
          const importMatches = jsContent.match(/import\s+.*from\s+["']([^"']+)["']/g) || [];
          if (importMatches.length > 0) {
            console.log(`      Import 수: ${importMatches.length}`);
          }
        }
      } catch (error) {
        console.log(`      ❌ 로딩 실패: ${error.message}`);
      }
    }
    
    // Check CSS files
    const cssMatches = html.match(/href="([^"]*\.css[^"]*)"/g) || [];
    console.log(`\n🎨 CSS 파일 수: ${cssMatches.length}`);
    
    for (const match of cssMatches) {
      const href = match.match(/href="([^"]*)"/)[1];
      const fullUrl = href.startsWith('http') ? href : `https://djyalu.github.io${href}`;
      console.log(`   🎨 ${href}`);
      
      try {
        const cssResponse = await fetch(fullUrl);
        console.log(`      상태: ${cssResponse.status} ${cssResponse.ok ? '✅' : '❌'}`);
        if (cssResponse.ok) {
          const cssContent = await cssResponse.text();
          console.log(`      크기: ${cssContent.length} bytes`);
        }
      } catch (error) {
        console.log(`      ❌ 로딩 실패: ${error.message}`);
      }
    }
    
    // Check if HTML has any content in body
    const bodyMatch = html.match(/<body[^>]*>(.*)<\/body>/s);
    if (bodyMatch) {
      const bodyContent = bodyMatch[1];
      const hasContent = bodyContent.trim().length > 200; // Reasonable content size
      console.log(`\n📝 Body 콘텐츠: ${hasContent ? '✅' : '❌'}`);
      
      if (!hasContent) {
        console.log('   ⚠️  Body에 충분한 콘텐츠가 없습니다.');
        console.log(`   실제 콘텐츠: ${bodyContent.trim().substring(0, 200)}...`);
      }
    }
    
    // Check for potential issues
    console.log('\n🔍 잠재적 문제점 체크:');
    
    const issues = [];
    
    if (!hasReactRoot) {
      issues.push('React Root div가 없음');
    }
    
    if (scriptMatches.length === 0) {
      issues.push('JavaScript 파일이 없음');
    }
    
    if (html.includes('src="/src/')) {
      issues.push('개발 모드 경로가 프로덕션에 포함됨');
    }
    
    if (!html.includes('crossorigin')) {
      issues.push('CORS 설정이 없을 수 있음');
    }
    
    if (issues.length === 0) {
      console.log('   ✅ 명백한 문제점이 발견되지 않았습니다.');
    } else {
      issues.forEach(issue => console.log(`   ❌ ${issue}`));
    }
    
    // Recommendations
    console.log('\n💡 권장사항:');
    console.log('   1. 브라우저 개발자 도구 (F12) 열기');
    console.log('   2. Console 탭에서 JavaScript 에러 확인');
    console.log('   3. Network 탭에서 실패한 리소스 확인');
    console.log('   4. Elements 탭에서 React 컴포넌트 마운팅 확인');
    console.log('   5. 페이지 새로고침 (Ctrl+F5) 시도');
    console.log('   6. 브라우저 캐시 클리어 시도');
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류:', error);
  }
}

debugBrowserIssues();