#!/usr/bin/env node

/**
 * API 엔드포인트: 실시간 AI 분석 실행
 * 브라우저에서 호출하여 새로운 Cohere AI 분석을 실행
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// CORS 헤더 설정
const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('🚀 실시간 AI 분석 요청 수신');
    
    // 응답을 즉시 시작하여 진행 상황을 스트리밍
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...Object.fromEntries(Object.entries(res.getHeaders()).filter(([key]) => key.startsWith('access-control')))
    });

    const sendUpdate = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 1단계: 분석 시작 알림
    sendUpdate({
      stage: 'starting',
      message: '🤖 Cohere AI 분석 시작...',
      progress: 10
    });

    // 2단계: 스크립트 실행
    sendUpdate({
      stage: 'executing',
      message: '📊 최신 날씨 데이터 수집 및 분석 중...',
      progress: 30
    });

    // AI 분석 스크립트 실행
    const scriptPath = path.join(process.cwd(), 'scripts', 'ai-weather-summary.js');
    const command = `COHERE_API_KEY="${process.env.COHERE_API_KEY}" FORCE_ANALYSIS=true node ${scriptPath}`;
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: 30000 // 30초 타임아웃
      });
      
      console.log('✅ AI 분석 스크립트 실행 완료:', output);
      
      sendUpdate({
        stage: 'processing',
        message: '🧠 Cohere AI 추론 엔진 처리 중...',
        progress: 70
      });

      // 3단계: 결과 파일 읽기
      const resultPath = path.join(process.cwd(), 'data', 'weather-summary', 'latest.json');
      
      if (fs.existsSync(resultPath)) {
        const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        
        sendUpdate({
          stage: 'completed',
          message: '✅ AI 분석 완료!',
          progress: 100,
          result: {
            analysis: result.summary || result.raw_analysis,
            confidence: result.confidence,
            model: result.ai_model,
            timestamp: result.timestamp
          }
        });
      } else {
        throw new Error('분석 결과 파일을 찾을 수 없습니다');
      }

    } catch (scriptError) {
      console.error('❌ AI 분석 스크립트 실행 실패:', scriptError);
      
      sendUpdate({
        stage: 'error',
        message: '❌ AI 분석 실행 중 오류 발생',
        progress: 0,
        error: scriptError.message
      });
    }

    // 연결 종료
    res.end();

  } catch (error) {
    console.error('🚨 API 핸들러 오류:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'AI 분석 실행 실패', 
        details: error.message 
      });
    }
  }
}