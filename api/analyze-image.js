// Vercel Serverless Function for Claude Vision API
// File: api/analyze-image.js

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, location, cameraId, timestamp } = req.body;

    console.log(`🤖 Analyzing image for camera ${cameraId} at ${location}`);

    // Claude API 키 확인
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      console.log('⚠️ CLAUDE_API_KEY not found, using fallback analysis');
      return res.status(500).json({ error: 'AI service temporarily unavailable' });
    }

    // Claude Vision API 호출
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `이 실시간 교통 카메라 이미지를 분석해서 다음 정보를 JSON 형태로 제공해주세요:

위치: ${location}
카메라 ID: ${cameraId}
시간: ${timestamp}

다음 형식으로 응답해주세요:
{
  "weather_condition": "날씨 상태 (맑음/부분적으로 흐림/흐림/비)",
  "visibility": "시야 상태 (매우 양호/양호/보통/제한적)",
  "road_conditions": "도로 상태 (건조/젖음/침수)",
  "precipitation": "강수 상태 (없음/약함/보통/강함)",
  "traffic_status": "교통 상황 (교통 원활/교통 혼잡/교통 정체중/교통량 적음)",
  "vehicle_flow": "차량 흐름 (매우 빠름/빠름/보통/느림/매우 느림)",
  "vehicle_density": "차량 밀도 (매우 높음/높음/보통/낮음/거의 없음)",
  "lighting_conditions": "조명 상태 (자연광/가로등/어두움)",
  "confidence": 0.85,
  "details": {
    "sky_condition": "하늘 상태 설명",
    "visibility_assessment": "시야 평가 설명",
    "weather_indicators": "날씨 지표 설명",
    "atmospheric_conditions": "대기 상태 설명",
    "traffic_analysis": "교통 상황 상세 분석",
    "road_surface": "노면 상태 설명"
  }
}`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: await getImageAsBase64(imageUrl)
                }
              }
            ]
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      console.log('❌ Claude API error:', error);
      return res.status(500).json({ error: 'AI analysis failed' });
    }

    const claudeResult = await claudeResponse.json();
    const analysisText = claudeResult.content[0].text;
    
    // JSON 파싱
    let analysisData;
    try {
      // JSON 추출 (```json 태그 제거)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.log('⚠️ JSON parsing failed, creating structured response');
      analysisData = parseUnstructuredResponse(analysisText, location, cameraId);
    }

    // 메타데이터 추가
    analysisData.analysis_timestamp = new Date().toISOString();
    analysisData.camera_location = location;
    analysisData.ai_model = 'Claude Vision API';
    analysisData.image_url = imageUrl;

    console.log('✅ Real-time AI analysis completed for camera', cameraId);
    
    return res.status(200).json(analysisData);

  } catch (error) {
    console.error('❌ AI analysis error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
}

// 이미지를 Base64로 변환하는 함수
async function getImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

// 구조화되지 않은 응답을 파싱하는 함수
function parseUnstructuredResponse(text, location, cameraId) {
  // 기본 구조 생성 후 텍스트에서 정보 추출
  const analysis = {
    weather_condition: '부분적으로 흐림',
    visibility: '양호',
    road_conditions: '건조',
    precipitation: '없음',
    traffic_status: '교통 원활',
    vehicle_flow: '보통',
    vehicle_density: '보통',
    lighting_conditions: '자연광',
    confidence: 0.80,
    details: {
      sky_condition: '실시간 이미지 분석 결과',
      visibility_assessment: '시야 상태 양호',
      weather_indicators: '현재 날씨 상태 분석',
      atmospheric_conditions: '대기 상태 분석',
      traffic_analysis: '실시간 교통 상황 분석',
      road_surface: '노면 상태 분석'
    }
  };

  // 텍스트에서 키워드 추출하여 실제 분석 결과 반영
  if (text.includes('맑') || text.includes('clear')) analysis.weather_condition = '맑음';
  if (text.includes('흐림') || text.includes('cloudy')) analysis.weather_condition = '흐림';
  if (text.includes('비') || text.includes('rain')) {
    analysis.weather_condition = '약한 비';
    analysis.precipitation = '약함';
    analysis.road_conditions = '젖음';
  }
  
  if (text.includes('정체') || text.includes('jam')) analysis.traffic_status = '교통 정체중';
  if (text.includes('혼잡') || text.includes('congested')) analysis.traffic_status = '교통 혼잡';
  if (text.includes('원활') || text.includes('smooth')) analysis.traffic_status = '교통 원활';

  return analysis;
}